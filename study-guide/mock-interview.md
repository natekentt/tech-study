# Mock Interview Questions

Practice these OUT LOUD. Set a timer: 2-3 minutes per answer. Speaking your answers forces you to organize your thoughts.

---

## Round 1: Kubernetes & CRD Design (30 min)

### Q1: Walk me through the Kubernetes control plane. What happens when you create a Deployment?

**Strong answer:**
The control plane has four main components. The **API Server** is the front door — every request goes through it. **etcd** is the distributed key-value store that holds all cluster state. The **Scheduler** assigns pods to nodes. The **Controller Manager** runs reconciliation loops.

When I `kubectl apply` a Deployment: kubectl sends the manifest to the API Server. It authenticates me, checks RBAC authorization, runs admission webhooks, validates the spec, and persists to etcd. The Deployment controller (in Controller Manager) sees the new Deployment and creates a ReplicaSet. The ReplicaSet controller sees it needs N pods and creates Pod objects. The Scheduler sees unscheduled pods, evaluates node fitness (resources, affinity, taints), and assigns each pod to a node. The kubelet on each assigned node pulls the container image and starts the containers.

Every step is driven by the reconciliation pattern — controllers watching for state changes and acting to converge actual state toward desired state.

---

### Q2: Design a CRD that lets developers deploy services to your platform.

**Strong answer:**
I'd create an `Application` CRD in a group like `platform.playstation.com/v1`. The spec would include: `repository` (git URL), `runtime` (language/version), `scaling` (min/max replicas, target CPU), and `networking` (ports, ingress hostname).

The key design principle is **spec vs status separation**. Users only write spec — what they want. The controller writes status — what's actually happening. I'd include a `conditions` array in status following the standard pattern (type, status, reason, message, lastTransitionTime).

The controller would reconcile this into multiple Kubernetes resources: a Deployment for the workload, a Service for networking, an HPA for autoscaling, a ServiceMonitor for observability, and NetworkPolicies for security. I'd use owner references so all child resources are garbage collected when the Application is deleted.

For validation, I'd combine OpenAPI schema in the CRD definition for static validation (types, enums, ranges) with a validating admission webhook for complex business rules (e.g., production apps must have at least 2 replicas).

---

### Q3: How do you handle CRD versioning when you need to make breaking changes?

**Strong answer:**
I'd follow the Kubernetes API versioning pattern. Start with `v1alpha1` for experimental APIs, graduate to `v1beta1` when stable, and `v1` for production.

For breaking changes: introduce the new version alongside the old one. Both versions are served by the API server simultaneously. Write a conversion webhook that translates between versions — this is key. Mark the new version as the storage version. Existing resources are stored in the new format, but clients using the old version still work because the webhook converts on the fly.

Then I'd deprecate the old version with a timeline, provide migration tooling, and eventually stop serving it. The key principle is: never break existing users. Always provide a migration path.

---

### Q4: Your operator creates Deployments as child resources. The Deployment gets modified by another controller. How do you handle this?

**Strong answer:**
This is the challenge of shared ownership. My approach: the operator should only manage the fields it cares about and use **server-side apply** with field managers. This way, my operator owns specific fields (like replicas, image) while another controller can own other fields (like annotations from a monitoring tool).

If I detect drift on fields I own (someone manually edited replicas), my reconciliation loop will revert it to the desired state from the CRD spec — that's the point of declarative management. But I should log a warning so the team knows their manual change was reverted.

I'd also set owner references so my child resources are garbage collected when the parent CRD is deleted. And I'd use resource versions for optimistic concurrency — if my update conflicts, I refetch and retry.

---

### Q5: Explain the difference between level-triggered and edge-triggered reconciliation. Why does Kubernetes prefer level-triggered?

**Strong answer:**
Edge-triggered means reacting to events — "a pod was created, do something." Level-triggered means reacting to state — "there should be 3 pods, there are 2, create one."

Kubernetes prefers level-triggered because it's more resilient. If an edge event is missed (controller was restarting, network blip), the system gets stuck. With level-triggered, the controller always compares desired vs actual state on each reconciliation — even if it missed events, it will catch up when it runs next. This makes controllers self-healing and idempotent. You can restart a controller at any time and it will converge to the right state.

---

## Round 2: Systems Design & Platform (30 min)

### Q6: Design a CI/CD platform for PlayStation's engineering organization.

**Strong answer:**
*(Start by asking clarifying questions)*: How many engineers and services? Multi-region? What languages/frameworks? Existing tools?

**High-level architecture:** I'd use a GitOps approach. Source of truth is Git. Argo CD watches repositories and syncs to Kubernetes clusters.

**Components:**
- **Pipeline CRD**: Developers define their build/test/deploy pipeline declaratively
- **Event Router**: GitHub webhooks trigger pipeline runs
- **Build System**: Ephemeral build pods (Tekton or Kaniko) for container builds — scales to zero when idle
- **Artifact Registry**: Internal container registry
- **Deployment**: Argo CD for GitOps sync to multiple environments
- **Promotion**: dev → staging (auto) → prod (approval gate)

**Key design decisions:**
- Pull-based (GitOps) over push-based for auditability and self-healing
- Ephemeral build environments for isolation and security
- Pipeline-as-code — pipelines live in the service's repo
- Shared pipeline library for common patterns (Go build, Python build, etc.)

**Developer experience:** A developer merges to main → build runs automatically → deploys to dev → runs integration tests → auto-promotes to staging → waits for approval → deploys to prod. Total time: minutes, not hours.

---

### Q7: How would you design a multi-tenant platform for 200 teams?

**Strong answer:**
I'd use namespace-based isolation with strong guardrails — the right balance of isolation, cost, and complexity for most organizations.

**Per-tenant setup:**
- Dedicated namespace with ResourceQuotas (CPU, memory, pod count limits)
- LimitRanges for per-pod defaults and maximums
- NetworkPolicies (default deny, allow only necessary traffic)
- RBAC (team members get namespace-scoped edit Role)
- ServiceAccount per workload

**Automation:** A `Tenant` CRD that a controller reconciles into all of the above. Onboarding a team = creating one YAML file, not filing 10 tickets.

**When to escalate isolation:** If a team has strict compliance requirements (PCI, HIPAA) or needs kernel-level isolation, consider vCluster (virtual clusters within the shared cluster) or dedicated clusters. But start with namespaces — they handle 90% of cases.

---

### Q8: One of your platform's core services has a cascading failure affecting multiple teams. Walk me through your response.

**Strong answer:**
**Immediate (first 5 minutes):**
- Check dashboards — what's the blast radius? Which services are affected?
- Check recent deployments — was anything deployed in the last hour?
- If a recent deploy, roll back immediately. GitOps makes this trivial — revert the commit.

**Diagnose (next 15 minutes):**
- Traces: Follow failing requests — where in the chain is the failure?
- Metrics: Resource usage, error rates, latency by service
- Logs: Filter by trace IDs of failing requests

**Mitigate:**
- Circuit breaking should already be limiting blast radius (Istio outlier detection)
- If a dependency is the problem, implement a fallback or shed load
- Scale up healthy services if they're overloaded from retries

**Prevent recurrence:**
- Postmortem within 48 hours — blameless, focused on systemic improvements
- Did our circuit breakers fire? If not, tune thresholds
- Did our alerts catch it fast enough? Improve SLO-based alerting
- Were we missing observability in the failing component?

---

### Q9: How would you introduce Istio service mesh to a platform with 500 existing services?

**Strong answer:**
Never big-bang. Phased rollout:

**Phase 1 (weeks 1-2):** Install Istio control plane. Enable sidecar injection on ONE low-risk namespace. Validate: latency impact? Breaking changes? Document any issues.

**Phase 2 (weeks 3-8):** Roll out namespace by namespace, starting with willing "lighthouse" teams. Provide opt-out annotations. First win: free observability — teams get traffic metrics and tracing without code changes.

**Phase 3 (months 2-3):** Enable mTLS in PERMISSIVE mode (accepts both plaintext and encrypted). Validate all services can communicate. Then migrate to STRICT namespace by namespace.

**Phase 4 (ongoing):** Enable advanced features — canary deployments, circuit breaking, authorization policies — team by team as they're ready.

**Key principles:** Gradual rollout, always have an escape hatch, start with non-breaking wins (observability), communicate heavily with teams, provide runbooks and support.

---

### Q10: Design a self-service experience for creating new services.

**Strong answer:**
I'd build a template-based system accessible through both a CLI and web portal.

**Flow:** Developer runs `psx create service --name my-service --template go-grpc` or clicks "New Service" in the portal. They provide: service name, team, template, and optionally customize settings.

**What happens behind the scenes:** A `ServiceTemplate` CRD is created. The controller: generates a Git repository from the template (with Dockerfile, CI pipeline, K8s manifests, README), creates the CI/CD pipeline in Argo CD, provisions the namespace (if needed), sets up monitoring (ServiceMonitor, dashboard), registers in the service catalog, and creates RBAC for the team.

**Time to first deploy:** Under 30 minutes. Developer creates the service, writes their code, pushes to main, and it's deployed to dev automatically.

**Templates include:** Dockerfile, standard health check endpoints, Prometheus metrics endpoint, structured logging, Kubernetes manifests with sensible defaults, CI pipeline definition, README with runbook template.

---

## Rapid-Fire Questions (practice quick, confident answers)

### Networking
**Q: How does kube-proxy work?**
A: kube-proxy runs on every node and maintains iptables or IPVS rules that route Service traffic to healthy backend pods. It watches the API server for Service and Endpoint changes and updates rules accordingly. In modern setups it uses IPVS for better performance at scale.

**Q: What's a headless Service?**
A: A Service with `clusterIP: None`. Instead of a virtual IP, DNS returns the individual pod IPs directly. Used with StatefulSets so clients can address specific pods (e.g., a specific database replica).

**Q: Explain Ingress vs Gateway API.**
A: Ingress is the original L7 routing resource — simple but limited (HTTP only, single resource for all config). Gateway API is the next-gen replacement — supports TCP/UDP, has role separation (infra team manages Gateway, app teams manage Routes), and is more expressive. Gateway API is the direction the ecosystem is moving.

### Security
**Q: What's the most important pod security setting?**
A: `runAsNonRoot: true` with `allowPrivilegeEscalation: false`. Running as root inside a container is the most common and exploitable misconfiguration. Combined with dropping all capabilities and a read-only filesystem, you eliminate most container breakout vectors.

**Q: How does RBAC work?**
A: Four resources: Roles define permissions (verbs on resources) within a namespace. ClusterRoles define cluster-wide permissions. RoleBindings grant a Role to users/groups in a namespace. ClusterRoleBindings grant a ClusterRole cluster-wide. Best practice: use namespace-scoped Roles, bind to groups (from your identity provider), and follow least privilege.

### Observability
**Q: What are the three pillars of observability?**
A: Metrics (Prometheus — what's happening numerically), Logs (Loki/ELK — detailed event records), and Traces (Jaeger/Tempo — request flow across services). Metrics tell you something is wrong, traces tell you where, logs tell you why.

**Q: What's the difference between monitoring and observability?**
A: Monitoring tells you when known failure modes occur (predefined alerts). Observability lets you ask arbitrary questions about your system's behavior — even questions you didn't anticipate. It's the difference between "alert me when error rate > 5%" and "why is this specific user's request slow on Tuesdays?"

### Platform
**Q: What's the biggest mistake platform teams make?**
A: Building a platform in isolation without continuous developer feedback. The platform becomes what the platform team thinks is useful, not what developers actually need. Treat it like a product — talk to your users, measure adoption, iterate based on feedback. Also: being too restrictive. If developers are working around your platform, that's a signal that your guardrails are gates.

**Q: How do you convince teams to adopt the platform?**
A: Make the paved road the easiest path, not the only path. If deploying through the platform takes 5 minutes and deploying without it takes 2 days, adoption happens naturally. Lead with value: "You get monitoring, CI/CD, security, and autoscaling for free." Start with lighthouse teams who are excited, get them successful, and let their success stories drive adoption.

---

## Questions to Ask YOUR Interviewers

1. "What does a typical service deployment look like today from a developer's perspective? What's the biggest friction point?"
2. "How are you approaching the balance between standardization and team autonomy?"
3. "What's the current state of your Kubernetes platform — are you building from scratch or evolving an existing system?"
4. "How do you measure the success of your platform? What metrics do you track?"
5. "What's the most exciting technical challenge your team is working on right now?"
6. "How do AI capabilities fit into your platform roadmap?"
