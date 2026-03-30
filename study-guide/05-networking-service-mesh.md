# Networking & Service Mesh

## Kubernetes Networking Fundamentals

### The Networking Model
Kubernetes has three simple rules:
1. **Every pod gets its own IP address** (no NAT between pods)
2. **All pods can communicate with all other pods** without NAT (by default)
3. **Agents on a node can communicate with all pods on that node**

This means: a pod on Node A can talk directly to a pod on Node B using the pod's IP. The network plugin (CNI) makes this work.

### Container Network Interface (CNI)
- Plugin system for pod networking
- Common CNIs: Calico, Cilium, Flannel, Weave
- CNI assigns IPs to pods, sets up routing between nodes
- **Calico**: BGP-based, supports NetworkPolicies, high performance
- **Cilium**: eBPF-based, advanced networking + security + observability

### How Requests Flow Through Kubernetes

```
Internet
    │
    ▼
┌──────────────┐
│ Load Balancer │   (cloud provider or MetalLB)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Ingress    │   (NGINX, Traefik, Istio Gateway)
│  Controller  │   Routes by host/path to Services
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │   (ClusterIP — stable virtual IP)
│              │   kube-proxy rules route to pods
└──────┬───────┘
       │
       ├──────────────┐
       ▼              ▼
┌──────────┐   ┌──────────┐
│  Pod A   │   │  Pod B   │   (load balanced across healthy pods)
└──────────┘   └──────────┘
```

## Service Types

### ClusterIP (default)
- Internal-only virtual IP
- Only accessible within the cluster
- DNS: `my-service.my-namespace.svc.cluster.local`
- Use for: service-to-service communication

### NodePort
- Exposes service on a static port on every node (30000-32767)
- Accessible at `<NodeIP>:<NodePort>`
- Rarely used in production — use LoadBalancer or Ingress instead

### LoadBalancer
- Provisions an external load balancer (cloud provider)
- Gets a public IP — traffic goes LB → NodePort → Pod
- One LB per service = expensive at scale

### Ingress
- HTTP/HTTPS routing layer — consolidates many services behind one LB
- Routes by hostname and path:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: platform-ingress
spec:
  rules:
    - host: matchmaking.playstation.com
      http:
        paths:
          - path: /api/v1
            pathType: Prefix
            backend:
              service:
                name: matchmaking-service
                port:
                  number: 8080
    - host: store.playstation.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: store-service
                port:
                  number: 8080
```

### Gateway API (newer, replacing Ingress)
- More expressive than Ingress
- Supports TCP/UDP, not just HTTP
- Role-based: Infra team manages GatewayClass/Gateway, app teams manage HTTPRoute
- Growing adoption — likely where K8s networking is heading

## DNS in Kubernetes

- CoreDNS runs as a Deployment in the cluster
- Every Service gets a DNS entry:
  - `<service>.<namespace>.svc.cluster.local`
  - Short form within same namespace: just `<service>`
- Pods can optionally get DNS entries (usually via StatefulSets)
- Headless Services (ClusterIP: None): DNS returns pod IPs directly — useful for StatefulSets

## NetworkPolicies

By default, all pods can talk to all pods. NetworkPolicies restrict this:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-matchmaking
  namespace: team-online
spec:
  podSelector:
    matchLabels:
      app: matchmaking
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: team-online   # Only from same namespace
        - podSelector:
            matchLabels:
              app: api-gateway    # Or from api-gateway
      ports:
        - port: 8080
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: databases
      ports:
        - port: 5432              # Only to postgres
    - to:                          # Allow DNS
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
```

**Key points:**
- NetworkPolicies are additive (union of all policies)
- No policy = allow all. Any policy = default deny for that direction
- Requires a CNI that supports NetworkPolicies (Calico, Cilium — not Flannel)
- Critical for multi-tenant platforms

---

## Service Mesh

### What is a Service Mesh?

A **dedicated infrastructure layer** for service-to-service communication. It handles: traffic management, security (mTLS), and observability — all without changing application code.

### How It Works: Sidecar Pattern

```
┌────────────────────────────────┐
│           Pod                   │
│                                 │
│  ┌────────────┐  ┌──────────┐ │
│  │ Your App   │──│  Envoy   │─┼──── Network
│  │ Container  │  │  Sidecar  │ │
│  └────────────┘  └──────────┘ │
│                                 │
└────────────────────────────────┘
```

Every pod gets a sidecar proxy (Envoy) injected automatically. All traffic in/out of the pod goes through this proxy. The proxy handles encryption, retries, circuit breaking, metrics — your app just makes normal HTTP/gRPC calls.

### Istio Architecture

```
┌─────────────────────────────────┐
│         Control Plane            │
│                                  │
│  ┌──────────────────────────┐   │
│  │         istiod            │   │
│  │  (Pilot + Citadel + Galley)│  │
│  └──────────────────────────┘   │
└──────────────┬──────────────────┘
               │ Config push (xDS)
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Envoy  │ │ Envoy  │ │ Envoy  │   Data Plane
│ sidecar│ │ sidecar│ │ sidecar│   (proxies handle all traffic)
└────────┘ └────────┘ └────────┘
```

**istiod** (control plane):
- **Pilot**: Configures Envoy proxies — converts high-level routing rules to Envoy config
- **Citadel**: Manages certificates for mTLS between services
- **Galley**: Validates Istio configuration

### Traffic Management

**VirtualService** — how to route traffic:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: matchmaking
spec:
  hosts:
    - matchmaking
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: matchmaking
            subset: canary
    - route:
        - destination:
            host: matchmaking
            subset: stable
          weight: 90
        - destination:
            host: matchmaking
            subset: canary
          weight: 10
```

**DestinationRule** — defines subsets and traffic policies:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: matchmaking
spec:
  host: matchmaking
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: DEFAULT
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: stable
      labels:
        version: v1
    - name: canary
      labels:
        version: v2
```

### Canary Deployments with Service Mesh
1. Deploy v2 alongside v1 with different labels
2. VirtualService routes 5% of traffic to v2
3. Monitor error rates and latency
4. Gradually shift: 5% → 25% → 50% → 100%
5. If v2 has problems, shift back to 0%

This is more controlled than Kubernetes rolling updates — you control exactly what percentage of real traffic hits the new version.

### mTLS (Mutual TLS)
- All service-to-service traffic is encrypted and authenticated
- Each service gets a certificate from Istio's CA
- Both sides verify each other's identity (mutual = both client and server authenticate)
- Modes: PERMISSIVE (accepts both plaintext and mTLS) → STRICT (mTLS only)

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: team-online
spec:
  mtls:
    mode: STRICT   # All traffic in this namespace must be mTLS
```

### Authorization Policies
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: matchmaking-access
  namespace: team-online
spec:
  selector:
    matchLabels:
      app: matchmaking
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/team-online/sa/api-gateway"]
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/v1/*"]
```

## Interview Questions

**Q: How does a request get from the internet to a pod?**
A: DNS resolves to the external load balancer → LB sends to a node (NodePort or directly) → Ingress controller routes by host/path → hits the Kubernetes Service → kube-proxy rules (iptables/IPVS) load-balance to a healthy pod. With a service mesh, the request additionally passes through the sidecar proxy for observability and policy enforcement.

**Q: What's the difference between an Ingress and a Service?**
A: A Service provides a stable internal IP for a set of pods (L4 — TCP/UDP). An Ingress provides L7 (HTTP) routing — it can route based on hostname and URL path, terminate TLS, and consolidate many services behind one external endpoint. An Ingress needs a Service to exist as its backend.

**Q: Why would you use a service mesh instead of just Kubernetes Services?**
A: Kubernetes Services give you basic load balancing and service discovery. A service mesh adds: mTLS encryption between services, fine-grained traffic management (canary, A/B testing, fault injection), retries and circuit breaking, detailed observability (per-request metrics, distributed tracing), and authorization policies — all without application code changes.

**Q: How would you implement canary deployments?**
A: With a service mesh (Istio): Deploy the new version alongside the old, use a VirtualService to shift a small percentage of traffic (e.g., 5%) to the new version, monitor error rates and latency, and gradually increase traffic. Without a mesh: use multiple Deployments with different labels and control traffic at the Ingress level, or use Argo Rollouts which provides similar functionality.

**Q: Explain NetworkPolicies. When would you use them?**
A: NetworkPolicies are Kubernetes-native firewall rules. By default, all pods can communicate freely. NetworkPolicies restrict which pods can talk to which. I'd use them for: tenant isolation in a multi-tenant cluster, restricting database access to only the services that need it, and implementing defense-in-depth alongside service mesh authorization. They work at L3/L4 (IP/port) while service mesh policies work at L7 (HTTP path/method).
