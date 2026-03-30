# Quick Reference Cheat Sheet
Review this the night before and morning of the interview.

---

## Kubernetes Architecture (draw this from memory)

```
CONTROL PLANE                          NODES
┌────────────────────────┐     ┌──────────────────┐
│ API Server (front door)│     │ kubelet (agent)   │
│ etcd (state store)     │     │ kube-proxy (svc   │
│ Scheduler (place pods) │     │   routing)        │
│ Controller Mgr (loops) │     │ Container Runtime │
└────────────────────────┘     └──────────────────┘
```

**What talks to etcd?** Only the API Server. Nothing else.

**Reconciliation loop:** Watch desired state → Compare to actual → Act → Repeat. EVERYTHING in K8s works this way.

---

## Key Resources — One-Line Definitions

| Resource | What It Is |
|----------|-----------|
| Pod | Smallest unit. One or more containers sharing network/storage. |
| Deployment | Manages ReplicaSets. Rolling updates. Stateless workloads. |
| StatefulSet | Stable identity, ordered scaling, persistent volumes. Databases. |
| DaemonSet | One pod per node. Logging agents, monitoring. |
| Service | Stable network endpoint for pods. ClusterIP/NodePort/LoadBalancer. |
| Ingress | L7 HTTP routing. Host/path-based routing to Services. |
| ConfigMap | Non-sensitive config. Env vars or volume mounts. |
| Secret | Sensitive data. Base64 (NOT encrypted by default). |
| Namespace | Logical isolation. Multi-tenancy. Quota/RBAC boundary. |
| CRD | Extend the K8s API with your own resource types. |
| HPA | Auto-scale pods based on metrics. |
| PDB | Minimum pods that must stay up during disruptions. |
| NetworkPolicy | Firewall rules between pods. Default: allow all. |
| ServiceAccount | Identity for pods to auth to API/cloud. |
| RBAC (Role/Binding) | Who can do what. Roles define perms, Bindings grant them. |

---

## CRD Design — Remember This Pattern

```yaml
spec:     # Desired state — user writes this
  ...
status:   # Observed state — controller writes this
  phase: Running
  conditions:
    - type: Available
      status: "True"
      reason: MinimumReplicasAvailable
```

**Controller loop (pseudocode):**
1. Fetch resource
2. Check if child resources exist → create if not
3. Compare desired vs actual → update if different
4. Update status
5. Return (requeue on error)

**Must be:** Idempotent, level-triggered, uses owner references.

---

## Networking Flow

```
Internet → Load Balancer → Ingress Controller → Service → Pod
                                                    ↕
                                              (kube-proxy rules
                                               route to healthy pods)
```

**Service types:** ClusterIP (internal) | NodePort (static port) | LoadBalancer (external LB)

**DNS:** `<svc>.<ns>.svc.cluster.local`

---

## Service Mesh (Istio) in 30 Seconds

- Sidecar proxy (Envoy) in every pod
- istiod = control plane (config, certs, policy)
- VirtualService = routing rules (canary, traffic split)
- DestinationRule = circuit breaking, connection pools
- PeerAuthentication = mTLS mode (PERMISSIVE → STRICT)
- AuthorizationPolicy = who can call whom

---

## Security Checklist

- [ ] RBAC: Namespace-scoped roles, groups not users, least privilege
- [ ] Pods: Non-root, no privilege escalation, drop all capabilities, read-only FS
- [ ] Network: NetworkPolicies (default deny), mTLS via mesh
- [ ] Secrets: External secrets manager (Vault), encrypt etcd at rest
- [ ] Images: Approved registries only, scan for CVEs, sign images
- [ ] Service accounts: One per workload, don't auto-mount tokens

---

## Observability — Three Pillars

| Pillar | Tool | What It Answers |
|--------|------|-----------------|
| Metrics | Prometheus + Grafana | What's happening? (rates, errors, latency) |
| Logs | Loki/ELK | Why is it happening? (error messages, context) |
| Traces | Jaeger/Tempo | Where is it happening? (which service, how long) |

**RED Method (services):** Rate, Errors, Duration
**USE Method (infra):** Utilization, Saturation, Errors

**SLI** = measurement. **SLO** = target. **SLA** = contract.
**Error budget** = allowed unreliability (99.9% SLO = 43 min/month downtime budget)

---

## Probes

| Probe | Question | Failure Action |
|-------|----------|---------------|
| Liveness | Is it stuck? | Restart container |
| Readiness | Can it handle traffic? | Remove from Service |
| Startup | Has it started? | Protect from premature liveness kill |

---

## Platform DX — Key Phrases

- "Golden paths, not golden cages"
- "Sensible defaults with escape hatches"
- "Guardrails, not gates"
- "Self-service over tickets"
- "The platform is a product, developers are customers"
- DORA metrics: Deploy frequency, Lead time, Change failure rate, MTTR

---

## Systems Design Framework

1. **Clarify** (2 min): Scale? Constraints? Priorities?
2. **High-level design** (5 min): Components, data flow, tech choices
3. **Deep dive** (15 min): Core component, APIs, failure modes
4. **Tradeoffs** (3 min): What breaks? What would you add?

**Platform design tip:** Start with "What does the developer see?" (a simple CRD/CLI), then work backwards to "What does the platform create?" (10+ K8s resources behind the scenes).

---

## Phrases That Impress Interviewers

- "I'd use the reconciliation pattern here..."
- "The controller would be idempotent — multiple reconcile runs produce the same result"
- "I'd separate spec (user intent) from status (observed state)"
- "We'd start with PERMISSIVE mTLS and migrate to STRICT namespace by namespace"
- "The error budget tells us when to prioritize features vs reliability"
- "I'd design this as a CRD so developers get native kubectl integration"
- "The platform should create guardrails, not gates — warn on non-critical, block only on critical"
