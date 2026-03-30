# Kubernetes Architecture & Internals

## The Big Picture

Kubernetes is a container orchestration platform. It takes your containers and figures out where to run them, keeps them running, and provides networking/storage/config to them. Think of it as a **declarative infrastructure API** — you tell it what you want (desired state), and it continuously works to make reality match.

## Cluster Architecture

```
                    ┌─────────────────────────────────────┐
                    │          CONTROL PLANE               │
                    │                                      │
                    │  ┌──────────┐    ┌───────────────┐  │
                    │  │ API      │    │ etcd          │  │
  kubectl ─────────┼─>│ Server   │───>│ (state store) │  │
                    │  └──────────┘    └───────────────┘  │
                    │       │                              │
                    │  ┌────┴─────┐   ┌────────────────┐  │
                    │  │Scheduler │   │Controller Mgr  │  │
                    │  └──────────┘   └────────────────┘  │
                    └─────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ Node 1  │    │ Node 2  │    │ Node 3  │
        │         │    │         │    │         │
        │ kubelet │    │ kubelet │    │ kubelet │
        │ kube-   │    │ kube-   │    │ kube-   │
        │ proxy   │    │ proxy   │    │ proxy   │
        │         │    │         │    │         │
        │ [pods]  │    │ [pods]  │    │ [pods]  │
        └─────────┘    └─────────┘    └─────────┘
```

## Control Plane Components

### API Server (kube-apiserver)
- **The front door to the cluster.** Every interaction goes through it.
- RESTful API — all resources are CRUD-able via HTTP
- Handles authentication, authorization (RBAC), admission control, validation
- The ONLY component that talks to etcd directly
- Stateless — you can run multiple replicas for HA

**Interview angle:** "Walk me through what happens when you run `kubectl apply -f deployment.yaml`"
1. kubectl sends HTTP POST/PUT to API server
2. API server authenticates the request (who are you?)
3. API server authorizes the request (are you allowed?)
4. Admission controllers mutate/validate (e.g., inject defaults, enforce policies)
5. Object is persisted to etcd
6. API server returns success to client
7. Controllers watching for changes pick it up from here

### etcd
- Distributed key-value store — the **single source of truth** for cluster state
- Uses Raft consensus for leader election and data replication
- Stores all cluster data: pods, services, secrets, configmaps, CRDs, everything
- Critical to back up — if etcd is lost, the cluster state is lost
- Typically 3 or 5 nodes for quorum (needs majority: 2/3 or 3/5)

**Interview angle:** "Why is etcd important and how do you protect it?"
- It's the entire cluster state. Back it up regularly. Encrypt at rest. Restrict network access. Monitor disk latency (etcd is sensitive to slow disks).

### Scheduler (kube-scheduler)
- Watches for newly created pods with no assigned node
- Scores nodes based on: resource availability, affinity/anti-affinity rules, taints/tolerations, topology spread
- Two-phase process: **filtering** (which nodes CAN run this pod?) then **scoring** (which is BEST?)
- Assigns pod to a node by updating the pod's `.spec.nodeName`

### Controller Manager (kube-controller-manager)
- Runs a collection of **controllers** — each watches a resource type and reconciles toward desired state
- Key controllers:
  - **Deployment controller**: manages ReplicaSets
  - **ReplicaSet controller**: ensures correct number of pod replicas
  - **Node controller**: monitors node health
  - **Job controller**: runs tasks to completion
  - **ServiceAccount controller**: creates default service accounts
- Each controller follows the **reconciliation loop**: Watch → Compare (desired vs actual) → Act → Repeat

## Node Components

### kubelet
- Agent running on every node
- Receives pod specs from API server, ensures containers are running and healthy
- Reports node status and pod status back to API server
- Manages container lifecycle through the Container Runtime Interface (CRI)
- Runs probes (liveness, readiness, startup)

### kube-proxy
- Runs on every node
- Maintains network rules (iptables or IPVS) for Service → Pod routing
- Enables the Service abstraction — when you hit a ClusterIP, kube-proxy routes to a healthy backend pod
- Does NOT proxy traffic itself in modern mode (just sets up rules)

### Container Runtime
- Actually runs containers (containerd, CRI-O)
- Docker was deprecated as a runtime in K8s 1.24 — containerd is standard now
- Implements the Container Runtime Interface (CRI)

## Key Abstractions (Resources)

### Pod
- Smallest deployable unit — one or more containers sharing network/storage
- Has a unique IP within the cluster
- Ephemeral — when a pod dies, it's gone (replaced, not restarted)
- Containers in a pod share localhost and can share volumes

### Deployment
- Declares desired state for pods (image, replicas, update strategy)
- Manages ReplicaSets under the hood
- Supports rolling updates and rollbacks
- Most common way to run stateless workloads

### ReplicaSet
- Ensures N identical pods are running at all times
- Created/managed by Deployments — you rarely interact directly
- Uses label selectors to identify its pods

### StatefulSet
- Like Deployment but for stateful workloads
- Provides: stable network identities (pod-0, pod-1), ordered deployment/scaling, persistent volume per pod
- Used for databases, message queues, etc.

### DaemonSet
- Runs one pod per node (or per matching node)
- Used for node-level agents: log collectors, monitoring agents, network plugins

### Service
- Stable network endpoint for a set of pods
- Types: ClusterIP (internal), NodePort (external via node port), LoadBalancer (cloud LB)
- Uses label selectors to find backend pods
- Gets a stable DNS name: `<service>.<namespace>.svc.cluster.local`

### ConfigMap & Secret
- ConfigMap: non-sensitive configuration data (key-value pairs or files)
- Secret: sensitive data (base64-encoded, NOT encrypted by default)
- Injected into pods as env vars or volume mounts

### Namespace
- Virtual cluster within a cluster — logical isolation
- Used for multi-tenancy, environment separation (dev/staging/prod in same cluster)
- Resource quotas and network policies can be scoped to namespaces

## The Reconciliation Loop (Critical Concept)

This is THE fundamental pattern in Kubernetes:

```
     ┌──────────────┐
     │ Desired State │ ← What the user declared (e.g., 3 replicas)
     └──────┬───────┘
            │
     ┌──────▼───────┐
     │   Compare    │ ← Controller checks: are there 3 pods running?
     └──────┬───────┘
            │
     ┌──────▼───────┐
     │     Act      │ ← If only 2 pods, create 1 more. If 4, delete 1.
     └──────┬───────┘
            │
            └──────────→ (loop forever)
```

Every controller, operator, and custom controller follows this pattern. It's what makes Kubernetes **self-healing** and **declarative**.

## How a Deployment Update Works

When you update a Deployment's image:

1. Deployment controller creates a NEW ReplicaSet with the new image
2. New RS scales up pods gradually (based on `maxSurge`)
3. Old RS scales down pods gradually (based on `maxUnavailable`)
4. This is a **rolling update** — zero-downtime by default
5. Old RS sticks around (with 0 replicas) for rollback capability

## Common Interview Questions

**Q: What happens when a node goes down?**
A: The node controller (in controller manager) detects the node is not reporting. After a timeout (default 5 min), it marks the node as `NotReady`. Pods on that node are evicted and rescheduled to healthy nodes by the scheduler (if managed by a Deployment/ReplicaSet).

**Q: How does Kubernetes know a pod is healthy?**
A: Three types of probes run by kubelet:
- **Liveness probe**: Is the container alive? If it fails, kubelet restarts the container.
- **Readiness probe**: Is the container ready to receive traffic? If it fails, the pod is removed from Service endpoints.
- **Startup probe**: Has the container started? Disables liveness/readiness until it passes. Good for slow-starting apps.

**Q: Explain desired state vs actual state.**
A: You declare desired state (e.g., "I want 3 replicas of my app"). Kubernetes controllers continuously compare actual state (how many pods are actually running) to desired state, and take action to converge. This is the reconciliation loop. It's why K8s is self-healing — if a pod crashes, the controller notices the mismatch and creates a new one.

**Q: What's the difference between a Deployment and a StatefulSet?**
A: Deployments are for stateless apps — pods are interchangeable. StatefulSets are for stateful apps — each pod has a stable identity (ordered name, persistent volume, stable network ID). StatefulSets scale up/down in order, making them suitable for databases or clustered systems.

**Q: How does kubectl apply work under the hood?**
A: kubectl sends the manifest to the API server as a PATCH (or creates if it doesn't exist). API server: authenticates → authorizes → runs admission webhooks → validates → stores in etcd → returns response. Then the appropriate controllers detect the change and reconcile.
