# Systems Design for Platform Engineering

## How to Approach Systems Design Questions

Every systems design answer should follow this structure:

### 1. Clarify Requirements (2-3 min)
- Ask about scale: How many developers? How many deployments/day?
- Ask about constraints: On-prem, cloud, hybrid? Existing tools?
- Ask about priorities: Reliability vs speed? Self-service vs guardrails?

### 2. High-Level Design (5-8 min)
- Draw the major components and how they interact
- Identify the data flow
- Call out key technology choices

### 3. Deep Dive (10-15 min)
- Drill into the most critical component
- Discuss APIs, data models, failure modes
- This is where CRD/operator design often comes in

### 4. Tradeoffs & Evolution (3-5 min)
- What are the tradeoffs of your design?
- How would it scale? What would you add next?
- What are the failure modes and how do you handle them?

---

## Scenario 1: Design an Internal Developer Platform (IDP)

**The Prompt:** "Design a platform that lets 1,000 engineers at PlayStation deploy and manage their services across multiple environments."

### Clarifying Questions to Ask
- What environments? (dev, staging, prod, multiple regions?)
- Cloud-only or hybrid (on-prem + cloud)?
- What's the current deployment process?
- Do teams own their infrastructure or does a platform team manage it?

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Developer Interface                  │
│                                                       │
│   CLI Tool    Web Portal    IDE Plugin    ChatOps    │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               Platform API Layer                      │
│                                                       │
│   Application CRD    Environment CRD    Pipeline CRD │
│                                                       │
│   ┌─────────────────────────────────┐                │
│   │    Platform Controllers          │                │
│   │    (Kubernetes Operators)        │                │
│   └─────────────────────────────────┘                │
└──────────────────────┬────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  CI/CD       │ │  K8s     │ │ Observability│
│  (Argo CD,   │ │ Clusters │ │ (Prometheus, │
│   GitHub     │ │ (multi-  │ │  Grafana,    │
│   Actions)   │ │  env)    │ │  Jaeger)     │
└──────────────┘ └──────────┘ └──────────────┘
```

### Core CRDs

**Application CRD** — the main developer-facing abstraction:
```yaml
apiVersion: platform.playstation.com/v1
kind: Application
metadata:
  name: matchmaking-service
  namespace: team-online
spec:
  owner: team-online
  repository: github.com/sie/matchmaking-service
  runtime: go-1.21
  scaling:
    minReplicas: 2
    maxReplicas: 50
    targetCPU: 70
  networking:
    ingress:
      host: matchmaking.internal.playstation.com
    ports:
      - name: grpc
        port: 9090
      - name: http
        port: 8080
  environments:
    - name: dev
      cluster: us-west-dev
      replicas: 1
    - name: prod
      cluster: us-west-prod
      replicas: 10
```

What the controller does behind the scenes:
- Creates Deployment, Service, HPA, Ingress, NetworkPolicy, ServiceMonitor
- Sets up namespace with resource quotas and RBAC
- Configures Argo CD Application for GitOps sync
- Registers with service mesh
- Creates Grafana dashboard

**Key design decision:** Developers interact with ONE resource (Application). The platform creates 10+ underlying Kubernetes resources. This is the **abstraction layer** — hiding complexity while preserving escape hatches.

### Why This Matters for PlayStation
- 1,000+ engineers shouldn't need to know Kubernetes internals
- Consistency: every service gets observability, security, networking by default
- Velocity: deploy a new service in minutes, not days
- Guardrails: enforce security policies, resource limits, naming conventions

---

## Scenario 2: Design a CI/CD Platform

**The Prompt:** "Design the CI/CD system for PlayStation's engineering org."

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   GitHub     │────>│  Event Router    │────>│  Pipeline    │
│   (source)   │     │  (webhook       │     │  Controller  │
│              │     │   receiver)      │     │              │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                      │
                                          ┌───────────┼───────────┐
                                          ▼           ▼           ▼
                                    ┌──────────┐ ┌────────┐ ┌──────────┐
                                    │  Build   │ │  Test  │ │  Deploy  │
                                    │  (Kaniko,│ │  (jobs)│ │  (Argo   │
                                    │   Tekton)│ │        │ │   CD)    │
                                    └──────────┘ └────────┘ └──────────┘
                                                              │
                                                    ┌─────────┼─────────┐
                                                    ▼         ▼         ▼
                                                   dev     staging     prod
                                                              │
                                                        [approval gate]
```

### Key Components

**Pipeline CRD:**
```yaml
apiVersion: platform.playstation.com/v1
kind: Pipeline
metadata:
  name: matchmaking-ci
spec:
  repository: github.com/sie/matchmaking-service
  triggers:
    - type: push
      branches: ["main", "release/*"]
    - type: pullRequest
  stages:
    - name: build
      type: docker-build
      dockerfile: Dockerfile
    - name: unit-test
      type: test
      command: "go test ./..."
    - name: integration-test
      type: test
      command: "go test -tags=integration ./..."
      dependsOn: [build]
    - name: deploy-dev
      type: deploy
      environment: dev
      auto: true
      dependsOn: [unit-test, integration-test]
    - name: deploy-staging
      type: deploy
      environment: staging
      auto: true
      dependsOn: [deploy-dev]
    - name: deploy-prod
      type: deploy
      environment: prod
      approval: required
      dependsOn: [deploy-staging]
```

### GitOps Pattern (Argo CD)
- Source of truth = Git repository
- Argo CD watches the repo, detects drift, syncs to cluster
- Developers merge to main → Argo CD deploys automatically
- Every deployment is auditable (it's a git commit)
- Rollback = revert the git commit

### Tradeoffs to Discuss
- **Push vs Pull deployment**: Push (Jenkins) = simpler but less auditable. Pull (Argo CD/GitOps) = more auditable, self-healing, but adds complexity.
- **Mono-repo vs multi-repo**: PlayStation scale = likely multi-repo with a shared pipeline library
- **Build infrastructure**: Ephemeral build pods in K8s (Kaniko/Tekton) vs dedicated build servers. Ephemeral = better isolation, auto-scaling. Dedicated = faster (cached layers).

---

## Scenario 3: Design a Multi-Tenant Kubernetes Platform

**The Prompt:** "How would you provide isolated Kubernetes environments to 200 development teams?"

### Approaches (from least to most isolated)

| Approach | Isolation | Cost | Complexity |
|----------|-----------|------|------------|
| Namespace per team | Low (soft) | Low | Low |
| Virtual clusters (vCluster) | Medium | Medium | Medium |
| Cluster per team | High | High | High |

### Recommended: Namespace-Based with Strong Guardrails

For most cases (and likely what PlayStation does):

```
Shared Cluster
├── namespace: team-online (matchmaking, lobbies)
│   ├── ResourceQuota (CPU: 100 cores, Memory: 200Gi)
│   ├── LimitRange (per-pod defaults)
│   ├── NetworkPolicy (deny-all-ingress, allow specific)
│   ├── RBAC (team members get edit role)
│   └── [team's workloads]
├── namespace: team-studios-guerrilla
│   ├── ResourceQuota
│   ├── NetworkPolicy
│   └── ...
└── namespace: platform-system (platform controllers, monitoring)
```

### Tenant Onboarding CRD
```yaml
apiVersion: platform.playstation.com/v1
kind: Tenant
metadata:
  name: team-online
spec:
  owners:
    - group: team-online-admins
  resourceQuota:
    cpu: "100"
    memory: "200Gi"
    pods: "500"
  networkPolicy: restricted    # Predefined policy template
  environments: [dev, staging, prod]
```

Controller creates: namespace, ResourceQuota, LimitRange, NetworkPolicies, RoleBindings, default ServiceAccount, monitoring dashboards.

### What the Interviewer Wants to Hear
- You understand the isolation spectrum and can pick the right level
- You know how to enforce resource fairness (quotas, limit ranges)
- You think about network isolation (NetworkPolicies)
- You think about RBAC (least privilege, team-scoped access)
- You can automate tenant provisioning (not manual kubectl commands)

---

## Scenario 4: Design a Service Mesh Rollout Strategy

**The Prompt:** "How would you roll out Istio service mesh to an existing platform with 500 services?"

### Phased Rollout

**Phase 1: Non-invasive observability**
- Install Istio control plane
- Enable sidecar injection on a single low-risk namespace
- Validate: Do existing apps still work? Is latency acceptable?
- Win: Teams get free observability (traffic metrics, tracing) without code changes

**Phase 2: Gradual adoption**
- Enable sidecar injection namespace-by-namespace
- Start with willing "lighthouse" teams
- Provide an opt-out mechanism (annotation to skip injection)
- Build internal docs and runbooks

**Phase 3: Traffic management**
- Enable canary deployments using VirtualServices
- Implement circuit breaking for critical paths
- Add retry policies and timeouts

**Phase 4: Security (mTLS everywhere)**
- Enable STRICT mTLS per-namespace
- Verify all service-to-service communication is encrypted
- Implement AuthorizationPolicies for zero-trust networking

### Key Point
Never do a big-bang rollout. The mesh adds a sidecar proxy to every pod — that changes networking behavior. Roll out gradually, validate each step, provide escape hatches.

---

## General Systems Design Tips for This Interview

1. **Always start with the developer experience.** "How would a developer interact with this?" Frame everything through the user's lens.

2. **Use CRDs as your API.** When asked "how would developers configure X," your answer should involve a CRD that abstracts the complexity.

3. **Show the abstraction layers.** Developer sees: one simple YAML. Platform creates: 10 K8s resources, monitoring, networking, security.

4. **Discuss failure modes.** What happens when the controller crashes? (Resources stay running — K8s is declarative. Controller catches up when it restarts.) What about etcd failure? Network partition?

5. **Connect to PlayStation's scale.** 1,000+ engineers, multiple studios, global infrastructure. Your designs should address multi-tenancy, self-service, and guardrails.
