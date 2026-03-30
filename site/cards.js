const FLASHCARDS = [
  // ── K8s Architecture ──────────────────────────────────────────
  {
    id: "k8s-01",
    category: "k8s",
    q: "What are the four control plane components and what does each do?",
    a: `<strong>API Server</strong> — front door; handles auth, RBAC, admission, persists to etcd. Only component that talks to etcd.<br><br>
<strong>etcd</strong> — distributed key-value store; single source of truth for all cluster state. Uses Raft consensus.<br><br>
<strong>Scheduler</strong> — watches for unscheduled pods, scores nodes (filter → score), assigns pods.<br><br>
<strong>Controller Manager</strong> — runs reconciliation loops (Deployment controller, ReplicaSet controller, Node controller, etc.).`
  },
  {
    id: "k8s-02",
    category: "k8s",
    q: "Walk through what happens when you run <code>kubectl apply -f deployment.yaml</code>.",
    a: `<ol>
<li>kubectl sends HTTP POST/PUT to <strong>API Server</strong></li>
<li>API Server <strong>authenticates</strong> (who are you?)</li>
<li>API Server <strong>authorizes</strong> via RBAC (are you allowed?)</li>
<li><strong>Admission controllers</strong> mutate/validate</li>
<li>Object persisted to <strong>etcd</strong></li>
<li><strong>Deployment controller</strong> sees new Deployment → creates ReplicaSet</li>
<li><strong>ReplicaSet controller</strong> creates Pod objects</li>
<li><strong>Scheduler</strong> assigns pods to nodes</li>
<li><strong>kubelet</strong> on each node pulls image and starts containers</li>
</ol>`
  },
  {
    id: "k8s-03",
    category: "k8s",
    q: "Explain the reconciliation loop. Why is it the most important pattern in Kubernetes?",
    a: `<strong>Watch desired state → Compare to actual state → Act → Repeat.</strong><br><br>
Every controller follows this pattern. It makes Kubernetes <strong>self-healing</strong> and <strong>declarative</strong>. If a pod crashes, the controller notices the mismatch (want 3, have 2) and creates a new one.<br><br>
This is <strong>level-triggered</strong> (react to state) not edge-triggered (react to events) — if an event is missed, the controller still converges on next loop.`
  },
  {
    id: "k8s-04",
    category: "k8s",
    q: "What happens when a node goes down?",
    a: `The <strong>node controller</strong> detects the node is not reporting heartbeats. After a timeout (default ~5 min), it marks the node <code>NotReady</code>.<br><br>
Pods on that node are <strong>evicted</strong> and rescheduled to healthy nodes by the scheduler (if managed by a Deployment/ReplicaSet).<br><br>
Standalone pods without a controller are lost.`
  },
  {
    id: "k8s-05",
    category: "k8s",
    q: "What's the difference between a Deployment and a StatefulSet?",
    a: `<strong>Deployment</strong> — stateless workloads. Pods are interchangeable, no stable identity, uses ReplicaSets for rolling updates.<br><br>
<strong>StatefulSet</strong> — stateful workloads. Each pod gets:<ul>
<li>Stable network identity (pod-0, pod-1)</li>
<li>Ordered deployment/scaling</li>
<li>Persistent volume per pod</li>
</ul>Used for databases, message queues, clustered systems.`
  },
  {
    id: "k8s-06",
    category: "k8s",
    q: "What are the three node components and what does each do?",
    a: `<strong>kubelet</strong> — agent on every node. Receives pod specs from API server, ensures containers are running, runs probes, reports status back.<br><br>
<strong>kube-proxy</strong> — maintains iptables/IPVS rules for Service → Pod routing. Enables the Service abstraction. Doesn't proxy traffic directly in modern mode.<br><br>
<strong>Container Runtime</strong> — actually runs containers (containerd, CRI-O). Implements the CRI. Docker deprecated since K8s 1.24.`
  },
  {
    id: "k8s-07",
    category: "k8s",
    q: "How does a Deployment rolling update work?",
    a: `<ol>
<li>Deployment controller creates a <strong>new ReplicaSet</strong> with the new image</li>
<li>New RS scales up gradually (based on <code>maxSurge</code>)</li>
<li>Old RS scales down gradually (based on <code>maxUnavailable</code>)</li>
<li>This is a <strong>rolling update</strong> — zero-downtime by default</li>
<li>Old RS sticks around (0 replicas) for <strong>rollback</strong> capability</li>
</ol>`
  },
  {
    id: "k8s-08",
    category: "k8s",
    q: "What is etcd and why is it critical?",
    a: `Distributed <strong>key-value store</strong> — the single source of truth for ALL cluster state (pods, services, secrets, CRDs, everything).<br><br>
Uses <strong>Raft consensus</strong> for leader election and replication. Typically 3 or 5 nodes for quorum.<br><br>
<strong>Only the API Server</strong> talks to etcd directly. If etcd is lost, the cluster state is lost.<br><br>
Protect it: back up regularly, encrypt at rest, restrict network access, monitor disk latency.`
  },
  {
    id: "k8s-09",
    category: "k8s",
    q: "What is a DaemonSet and when would you use one?",
    a: `Runs <strong>one pod per node</strong> (or per matching node).<br><br>
Used for node-level agents:<ul>
<li>Log collectors (Fluentd, Fluent Bit)</li>
<li>Monitoring agents (Prometheus node exporter)</li>
<li>Network plugins (CNI, kube-proxy)</li>
<li>Security agents</li>
</ul>`
  },
  {
    id: "k8s-10",
    category: "k8s",
    q: "What is a Pod? Why is it ephemeral?",
    a: `Smallest deployable unit — <strong>one or more containers</strong> sharing network namespace and storage volumes.<br><br>
Each pod gets a unique cluster IP. Containers in a pod share localhost.<br><br>
<strong>Ephemeral</strong>: when a pod dies, it's gone — replaced, not restarted. A new pod gets a new IP and identity. This is why you need Deployments/ReplicaSets to manage them.`
  },

  // ── CRD / API Design ─────────────────────────────────────────
  {
    id: "crd-01",
    category: "crd",
    q: "What is a CRD and why would you create one?",
    a: `A <strong>Custom Resource Definition</strong> extends the Kubernetes API with your own resource types. Like built-in resources (Pods, Services), but custom (GameServer, Pipeline, Application).<br><br>
Users can <code>kubectl apply</code> your custom resources. The API server handles storage, validation, RBAC — <strong>you get it all for free</strong>.<br><br>
A CRD + custom controller = an <strong>Operator</strong>.`
  },
  {
    id: "crd-02",
    category: "crd",
    q: "Explain the spec vs status pattern. Why does it matter?",
    a: `<strong>spec</strong> — desired state. What the <strong>user</strong> wants. Only the user modifies it.<br><br>
<strong>status</strong> — observed state. What the <strong>controller</strong> reports. Only the controller modifies it.<br><br>
This separation enables the reconciliation loop. Use the <code>/status</code> subresource so spec and status are updated through separate API endpoints — prevents accidental overwrites and allows different RBAC rules.`
  },
  {
    id: "crd-03",
    category: "crd",
    q: "What are the five key controller principles?",
    a: `<ol>
<li><strong>Idempotent</strong> — running reconcile multiple times produces the same result</li>
<li><strong>Level-triggered</strong> — compare desired vs actual state each time, don't rely on events</li>
<li><strong>Own your children</strong> — set owner references on sub-resources for garbage collection</li>
<li><strong>Requeue on failure</strong> — return error and the controller retries</li>
<li><strong>Single responsibility</strong> — one controller manages one resource type</li>
</ol>`
  },
  {
    id: "crd-04",
    category: "crd",
    q: "How do you handle CRD versioning when you need breaking changes?",
    a: `<ol>
<li>Introduce new version (e.g., <code>v1beta1</code>) alongside old (<code>v1alpha1</code>)</li>
<li>Write a <strong>conversion webhook</strong> to translate between versions</li>
<li>Mark the new version as the <strong>storage version</strong></li>
<li>Both versions served simultaneously — existing clients still work</li>
<li>Deprecate old version with a timeline, provide migration tooling</li>
</ol>
<strong>Key principle:</strong> never break existing users. Always provide a migration path.`
  },
  {
    id: "crd-05",
    category: "crd",
    q: "What's the difference between mutating and validating admission webhooks?",
    a: `<strong>Mutating webhooks</strong> — modify resources before persistence. Inject defaults, add labels, inject sidecars. Run <strong>first</strong>.<br><br>
<strong>Validating webhooks</strong> — accept or reject resources. Enforce policies, check cross-resource constraints. Run <strong>second</strong>.<br><br>
Order matters: validators see the <strong>mutated</strong> version.<br><br>
Flow: Request → Auth → AuthZ → <strong>Mutating</strong> → <strong>Validating</strong> → etcd`
  },
  {
    id: "crd-06",
    category: "crd",
    q: "What is level-triggered vs edge-triggered reconciliation? Why does K8s prefer level-triggered?",
    a: `<strong>Edge-triggered</strong> = react to events ("a pod was created, do something").<br><br>
<strong>Level-triggered</strong> = react to state ("there should be 3 pods, there are 2, create one").<br><br>
K8s prefers level-triggered because it's <strong>more resilient</strong>. If an event is missed (controller restarting, network blip), the system recovers on the next reconciliation. Controllers are <strong>self-healing</strong> and <strong>idempotent</strong>.`
  },
  {
    id: "crd-07",
    category: "crd",
    q: "How do you ensure your controller is idempotent?",
    a: `<ul>
<li>Always <strong>compare desired vs actual</strong> state — don't assume what happened before</li>
<li>Use <strong>CreateOrUpdate</strong> patterns — check if resource exists before creating</li>
<li>Use <strong>resource versions</strong> for optimistic concurrency (conflict detection)</li>
<li>Set <strong>owner references</strong> so child resources are garbage collected</li>
<li>Don't store state in the controller — use the <strong>status subresource</strong></li>
</ul>`
  },
  {
    id: "crd-08",
    category: "crd",
    q: "Your operator's child Deployment gets modified by another controller. How do you handle this?",
    a: `Use <strong>server-side apply</strong> with field managers — the operator owns specific fields (replicas, image), another controller can own other fields (annotations).<br><br>
If drift is detected on fields the operator owns, the <strong>reconciliation loop reverts</strong> it to the desired state from the CRD spec. Log a warning so the team knows.<br><br>
Use <strong>owner references</strong> for GC and <strong>resource versions</strong> for optimistic concurrency — refetch and retry on conflict.`
  },
  {
    id: "crd-09",
    category: "crd",
    q: "What is the standard status conditions pattern?",
    a: `A standardized array for reporting multiple aspects of status. Each condition has:<br><br>
<ul>
<li><code>type</code> — what aspect (Available, Ready, Progressing, Degraded)</li>
<li><code>status</code> — True / False / Unknown</li>
<li><code>reason</code> — machine-readable reason</li>
<li><code>message</code> — human-readable detail</li>
<li><code>lastTransitionTime</code> — when the status last changed</li>
</ul>`
  },

  // ── Systems Design ────────────────────────────────────────────
  {
    id: "sys-01",
    category: "systems",
    q: "What is the 4-step framework for answering systems design questions?",
    a: `<ol>
<li><strong>Clarify</strong> (2-3 min) — scale, constraints, priorities. Ask questions!</li>
<li><strong>High-level design</strong> (5-8 min) — major components, data flow, tech choices</li>
<li><strong>Deep dive</strong> (10-15 min) — drill into critical component, APIs, failure modes</li>
<li><strong>Tradeoffs & evolution</strong> (3-5 min) — what breaks? how to scale? what's next?</li>
</ol>
<strong>Tip:</strong> Start with "What does the developer see?" then work backwards to what the platform creates.`
  },
  {
    id: "sys-02",
    category: "systems",
    q: "Design a CI/CD platform — what are the key components?",
    a: `<ul>
<li><strong>Pipeline CRD</strong> — developers define build/test/deploy declaratively</li>
<li><strong>Event Router</strong> — GitHub webhooks trigger pipeline runs</li>
<li><strong>Build System</strong> — ephemeral build pods (Tekton/Kaniko), scales to zero</li>
<li><strong>Artifact Registry</strong> — internal container registry</li>
<li><strong>Deployment</strong> — Argo CD for GitOps sync to multiple environments</li>
<li><strong>Promotion</strong> — dev → staging (auto) → prod (approval gate)</li>
</ul>
<strong>Key:</strong> Pull-based (GitOps) over push-based for auditability and self-healing.`
  },
  {
    id: "sys-03",
    category: "systems",
    q: "How would you design a multi-tenant K8s platform for 200 teams?",
    a: `<strong>Namespace-based isolation with strong guardrails.</strong> Per-tenant setup:<br><br>
<ul>
<li><strong>ResourceQuotas</strong> — CPU, memory, pod count limits</li>
<li><strong>LimitRanges</strong> — per-pod defaults and maximums</li>
<li><strong>NetworkPolicies</strong> — default deny, allow only necessary traffic</li>
<li><strong>RBAC</strong> — namespace-scoped edit Role per team</li>
<li><strong>ServiceAccount</strong> per workload</li>
</ul>
Automate with a <strong>Tenant CRD</strong> — onboarding a team = creating one YAML.<br><br>
Escalate to vCluster or dedicated clusters only for strict compliance needs.`
  },
  {
    id: "sys-04",
    category: "systems",
    q: "What does the Application CRD abstraction pattern look like?",
    a: `Developers interact with <strong>ONE resource</strong> (Application CRD). The controller creates 10+ underlying K8s resources:<br><br>
<ul>
<li>Deployment, Service, HPA, Ingress</li>
<li>NetworkPolicy</li>
<li>ServiceMonitor (observability)</li>
<li>Argo CD Application (GitOps)</li>
<li>Grafana dashboard</li>
<li>Namespace with ResourceQuotas & RBAC</li>
</ul>
<strong>This is the abstraction layer</strong> — hiding complexity while preserving escape hatches.`
  },
  {
    id: "sys-05",
    category: "systems",
    q: "GitOps pattern — what is it and why use it?",
    a: `<strong>Source of truth = Git repository.</strong><br><br>
Argo CD watches repos, detects drift, syncs to cluster.<br><br>
<strong>Benefits:</strong><ul>
<li>Every deployment is auditable (it's a git commit)</li>
<li>Rollback = revert the git commit</li>
<li>Self-healing — drift is automatically corrected</li>
<li>Pull-based = more secure than push-based (no cluster credentials in CI)</li>
</ul>`
  },
  {
    id: "sys-06",
    category: "systems",
    q: "Cascading failure — walk through your incident response.",
    a: `<strong>Immediate (first 5 min):</strong> Check dashboards (blast radius), check recent deploys, roll back if recent deploy (GitOps = revert commit).<br><br>
<strong>Diagnose (next 15 min):</strong> Traces (where in the chain?), metrics (resource usage, error rates), logs (filter by trace IDs).<br><br>
<strong>Mitigate:</strong> Circuit breaking should limit blast radius. Fallbacks or load shedding. Scale up healthy services.<br><br>
<strong>Prevent recurrence:</strong> Blameless postmortem within 48h. Tune circuit breakers, improve SLO-based alerting.`
  },

  // ── Platform DX ───────────────────────────────────────────────
  {
    id: "dx-01",
    category: "dx",
    q: "What are the five core principles of great developer experience?",
    a: `<ol>
<li><strong>Golden paths, not golden cages</strong> — paved road is easy, unpaved road isn't blocked</li>
<li><strong>Sensible defaults with escape hatches</strong> — minimal config for common cases, power users can override</li>
<li><strong>Fast feedback loops</strong> — deploy in < 5 min, build failures in < 2 min</li>
<li><strong>Self-service over tickets</strong> — never file a ticket to create a service, deploy, or view logs</li>
<li><strong>Guardrails, not gates</strong> — guide developers, don't block them. Warn on non-critical, block only critical.</li>
</ol>`
  },
  {
    id: "dx-02",
    category: "dx",
    q: "What are the DORA metrics?",
    a: `Four key metrics for software delivery performance:<br><br>
<ol>
<li><strong>Deployment frequency</strong> — how often you ship</li>
<li><strong>Lead time for changes</strong> — commit to production</li>
<li><strong>Change failure rate</strong> — % of deploys causing incidents</li>
<li><strong>Time to restore service (MTTR)</strong> — how fast you recover</li>
</ol>
<strong>Elite teams:</strong> deploy multiple times/day, < 1 hour lead time, < 5% failure rate, < 1 hour recovery.`
  },
  {
    id: "dx-03",
    category: "dx",
    q: "How do you measure the success of a developer platform?",
    a: `<strong>Quantitative:</strong> DORA metrics (deploy frequency, lead time, change failure rate, MTTR), adoption rate, time to first deploy.<br><br>
<strong>Qualitative:</strong> Developer satisfaction surveys, NPS scores.<br><br>
If teams are choosing <strong>NOT</strong> to use the platform, that's a signal. If developers are working <strong>around</strong> your platform, your guardrails are gates.`
  },
  {
    id: "dx-04",
    category: "dx",
    q: "A team says your platform is too restrictive. How do you handle it?",
    a: `<ol>
<li><strong>Listen.</strong> Understand their specific pain point.</li>
<li>Are they blocked by a real limitation or unaware of an existing escape hatch?</li>
<li>If real limitation: is this a <strong>common need</strong> (build it in) or a <strong>one-off</strong> (provide an escape hatch)?</li>
</ol>
Every constraint should have a justification. Power users should be able to override non-critical defaults.<br><br>
<strong>Goal:</strong> golden paths, not golden cages.`
  },
  {
    id: "dx-05",
    category: "dx",
    q: "What makes a good platform API?",
    a: `<ul>
<li><strong>Declarative</strong> — describe what you want, not how</li>
<li><strong>Sensible defaults</strong> — minimal config for common cases</li>
<li><strong>Consistent</strong> — same patterns everywhere</li>
<li><strong>Well-documented</strong> with examples</li>
<li><strong>Clear error messages</strong></li>
<li><strong>Versioned</strong> — evolve without breaking users</li>
</ul>
Litmus test: would <strong>I</strong> want to use this API as a developer?`
  },
  {
    id: "dx-06",
    category: "dx",
    q: "What is the Internal Developer Platform (IDP) stack?",
    a: `Four layers, each hiding the complexity below:<br><br>
<ol>
<li><strong>Developer Interface</strong> — Portal, CLI, IDE plugins, ChatOps</li>
<li><strong>Platform APIs (CRDs)</strong> — Application, Pipeline, Environment</li>
<li><strong>Platform Controllers</strong> — Operators that reconcile CRDs</li>
<li><strong>Infrastructure</strong> — K8s, cloud services, networking</li>
</ol>
Developers interact with the top layer. They don't need to know K8s, RBAC, NetworkPolicies, or Prometheus.`
  },
  {
    id: "dx-07",
    category: "dx",
    q: "How do you convince teams to adopt the platform?",
    a: `Make the paved road the <strong>easiest path, not the only path</strong>.<br><br>
If deploying through the platform takes 5 minutes and without it takes 2 days, adoption happens naturally.<br><br>
Lead with value: <em>"You get monitoring, CI/CD, security, and autoscaling for free."</em><br><br>
Start with <strong>lighthouse teams</strong> who are excited, get them successful, and let their success stories drive adoption.`
  },

  // ── Networking ────────────────────────────────────────────────
  {
    id: "net-01",
    category: "networking",
    q: "What are the three Kubernetes networking rules?",
    a: `<ol>
<li>Every pod gets its <strong>own IP address</strong> (no NAT between pods)</li>
<li>All pods can communicate with <strong>all other pods</strong> without NAT (by default)</li>
<li>Agents on a node can communicate with all pods on that node</li>
</ol>
The CNI plugin (Calico, Cilium, Flannel) makes this work by assigning IPs and setting up routing between nodes.`
  },
  {
    id: "net-02",
    category: "networking",
    q: "How does a request flow from the internet to a pod?",
    a: `DNS → <strong>External Load Balancer</strong> → <strong>Ingress Controller</strong> (routes by host/path) → <strong>Service</strong> (ClusterIP) → <strong>kube-proxy rules</strong> (iptables/IPVS) → <strong>healthy Pod</strong>.<br><br>
With a service mesh, requests additionally pass through the <strong>Envoy sidecar proxy</strong> for observability and policy enforcement.`
  },
  {
    id: "net-03",
    category: "networking",
    q: "What are the four Service types?",
    a: `<strong>ClusterIP</strong> (default) — internal-only virtual IP. Service-to-service communication.<br><br>
<strong>NodePort</strong> — static port on every node (30000-32767). Rarely used in production.<br><br>
<strong>LoadBalancer</strong> — provisions an external cloud LB. One LB per service = expensive at scale.<br><br>
<strong>Headless</strong> (<code>clusterIP: None</code>) — DNS returns individual pod IPs directly. Used with StatefulSets for addressing specific pods.`
  },
  {
    id: "net-04",
    category: "networking",
    q: "Ingress vs Gateway API — what's the difference?",
    a: `<strong>Ingress</strong> — original L7 routing. Simple but limited: HTTP only, single resource for all config.<br><br>
<strong>Gateway API</strong> — next-gen replacement:<ul>
<li>Supports TCP/UDP, not just HTTP</li>
<li><strong>Role separation</strong> — infra team manages GatewayClass/Gateway, app teams manage HTTPRoute</li>
<li>More expressive routing</li>
</ul>
Gateway API is the direction the ecosystem is moving.`
  },
  {
    id: "net-05",
    category: "networking",
    q: "What are NetworkPolicies and when do you use them?",
    a: `Kubernetes-native <strong>firewall rules</strong>. By default, all pods can talk to all pods. NetworkPolicies restrict this.<br><br>
<strong>Key rules:</strong><ul>
<li>Policies are <strong>additive</strong> (union of all policies)</li>
<li>No policy = allow all. Any policy = <strong>default deny</strong> for that direction</li>
<li>Requires a CNI that supports them (Calico, Cilium — not Flannel)</li>
</ul>
Use for: tenant isolation, restricting database access, defense-in-depth alongside service mesh. They work at <strong>L3/L4</strong> (IP/port).`
  },
  {
    id: "net-06",
    category: "networking",
    q: "What is a service mesh and how does the sidecar pattern work?",
    a: `A <strong>dedicated infrastructure layer</strong> for service-to-service communication. Handles traffic management, security (mTLS), and observability — <strong>without changing application code</strong>.<br><br>
Every pod gets an <strong>Envoy sidecar proxy</strong> injected automatically. All traffic in/out goes through the proxy. It handles encryption, retries, circuit breaking, metrics.<br><br>
Your app just makes normal HTTP/gRPC calls.`
  },
  {
    id: "net-07",
    category: "networking",
    q: "What are the key Istio resources?",
    a: `<strong>istiod</strong> — control plane (Pilot + Citadel + Galley). Configures proxies, manages certs, validates config.<br><br>
<strong>VirtualService</strong> — routing rules (canary, traffic splitting, retries, timeouts).<br><br>
<strong>DestinationRule</strong> — circuit breaking, connection pools, subset definitions.<br><br>
<strong>PeerAuthentication</strong> — mTLS mode (PERMISSIVE → STRICT).<br><br>
<strong>AuthorizationPolicy</strong> — who can call whom (zero-trust).`
  },
  {
    id: "net-08",
    category: "networking",
    q: "How would you implement canary deployments with a service mesh?",
    a: `<ol>
<li>Deploy v2 alongside v1 with <strong>different labels</strong></li>
<li>VirtualService routes <strong>5%</strong> of traffic to v2</li>
<li>Monitor error rates and latency</li>
<li>Gradually shift: 5% → 25% → 50% → 100%</li>
<li>If v2 has problems, shift back to <strong>0%</strong></li>
</ol>
More controlled than K8s rolling updates — you control <strong>exact percentage</strong> of real traffic hitting the new version.`
  },
  {
    id: "net-09",
    category: "networking",
    q: "How does kube-proxy work?",
    a: `Runs on every node. Maintains <strong>iptables or IPVS rules</strong> that route Service traffic to healthy backend pods.<br><br>
Watches the API server for Service and Endpoint changes, updates rules accordingly.<br><br>
In modern setups uses <strong>IPVS</strong> for better performance at scale. Does NOT proxy traffic itself — just sets up kernel rules.`
  },
  {
    id: "net-10",
    category: "networking",
    q: "How does DNS work in Kubernetes?",
    a: `<strong>CoreDNS</strong> runs as a Deployment in the cluster.<br><br>
Every Service gets a DNS entry: <code>&lt;service&gt;.&lt;namespace&gt;.svc.cluster.local</code><br><br>
Short form within the same namespace: just <code>&lt;service&gt;</code><br><br>
<strong>Headless Services</strong> (<code>clusterIP: None</code>): DNS returns pod IPs directly — used with StatefulSets so clients can address specific pods.`
  },

  // ── Security ──────────────────────────────────────────────────
  {
    id: "sec-01",
    category: "security",
    q: "What are the seven layers of Kubernetes security?",
    a: `<ol>
<li><strong>Cluster Security</strong> — API server hardening, etcd encryption</li>
<li><strong>Authentication & Authorization</strong> — who are you, what can you do?</li>
<li><strong>Admission Control</strong> — is this request allowed by policy?</li>
<li><strong>Pod Security</strong> — what can the container do?</li>
<li><strong>Network Security</strong> — who can talk to whom?</li>
<li><strong>Runtime Security</strong> — is anything suspicious happening?</li>
<li><strong>Supply Chain Security</strong> — is the image trustworthy?</li>
</ol>`
  },
  {
    id: "sec-02",
    category: "security",
    q: "Explain RBAC — the four resources and best practices.",
    a: `<strong>Role</strong> — permissions (verbs on resources) within a namespace.<br>
<strong>ClusterRole</strong> — cluster-wide permissions.<br>
<strong>RoleBinding</strong> — grants a Role to users/groups in a namespace.<br>
<strong>ClusterRoleBinding</strong> — grants a ClusterRole cluster-wide.<br><br>
<strong>Best practices:</strong><ul>
<li>Least privilege — minimum permissions needed</li>
<li>Use <strong>Groups</strong>, not individual users</li>
<li>Namespace-scoped Roles over ClusterRoles</li>
<li>No wildcards in production</li>
<li>Audit regularly</li>
</ul>`
  },
  {
    id: "sec-03",
    category: "security",
    q: "What are the most important pod security settings?",
    a: `<ol>
<li><code>runAsNonRoot: true</code> — <strong>most important</strong>. Don't run as root.</li>
<li><code>allowPrivilegeEscalation: false</code> — prevents setuid</li>
<li><code>readOnlyRootFilesystem: true</code> — immutable container FS</li>
<li><code>capabilities: drop: ["ALL"]</code> — drop all Linux capabilities</li>
<li><code>automountServiceAccountToken: false</code> — don't mount if not needed</li>
<li>Set <strong>resource limits</strong> always</li>
<li>Enable <strong>seccomp</strong> profile (RuntimeDefault)</li>
</ol>`
  },
  {
    id: "sec-04",
    category: "security",
    q: "How do you manage secrets at scale?",
    a: `K8s Secrets are <strong>base64-encoded, NOT encrypted by default</strong>.<br><br>
<strong>Production approach:</strong><ul>
<li>Use <strong>external secrets manager</strong> (Vault, AWS Secrets Manager) as source of truth</li>
<li>Sync to K8s via <strong>External Secrets Operator</strong></li>
<li>Enable <strong>encryption at rest</strong> for etcd</li>
<li>Never store secrets in Git (use Sealed Secrets if you must)</li>
<li>Rotate secrets automatically</li>
<li>Audit secret access</li>
<li>Each workload gets only the secrets it needs</li>
</ul>`
  },
  {
    id: "sec-05",
    category: "security",
    q: "What are the three Pod Security Standards (PSS) levels?",
    a: `Replaced PodSecurityPolicies. Applied via <strong>namespace labels</strong>:<br><br>
<strong>Privileged</strong> — no restrictions. Only for system workloads.<br><br>
<strong>Baseline</strong> — prevents known privilege escalations. Good default.<br><br>
<strong>Restricted</strong> — heavily restricted. Best for untrusted workloads.<br><br>
Modes: <code>enforce</code> (block), <code>warn</code> (allow + warn), <code>audit</code> (allow + log).`
  },
  {
    id: "sec-06",
    category: "security",
    q: "How do you implement least privilege in Kubernetes?",
    a: `Multiple layers:<br><br>
<ol>
<li><strong>RBAC</strong> — namespace-scoped Roles with only needed verbs/resources, bind to groups</li>
<li><strong>Service accounts</strong> — one per workload, only mount tokens when needed</li>
<li><strong>Pod security</strong> — non-root, drop capabilities, read-only FS</li>
<li><strong>Network policies</strong> — default deny, explicit allow</li>
<li><strong>Secrets</strong> — only mount what each workload needs</li>
</ol>`
  },
  {
    id: "sec-07",
    category: "security",
    q: "How do you prevent container breakout?",
    a: `<ul>
<li>Run as <strong>non-root</strong></li>
<li>Disable <strong>privilege escalation</strong></li>
<li>Drop <strong>all Linux capabilities</strong></li>
<li>Use <strong>read-only root filesystem</strong></li>
<li>Enable <strong>seccomp profiles</strong> (RuntimeDefault minimum)</li>
<li>Use <strong>gVisor or Kata Containers</strong> for stronger isolation if needed</li>
<li>Keep node OS and container runtime <strong>patched</strong></li>
<li>Scan images for <strong>CVEs</strong></li>
<li>Enforce <strong>Pod Security Standards</strong> at namespace level</li>
</ul>`
  },
  {
    id: "sec-08",
    category: "security",
    q: "What is mTLS and how does Istio implement it?",
    a: `<strong>Mutual TLS</strong> — both client and server authenticate each other and encrypt traffic.<br><br>
Istio's Citadel component manages certificates. Each service gets a cert from Istio's CA.<br><br>
<strong>Modes:</strong><ul>
<li><code>PERMISSIVE</code> — accepts both plaintext and mTLS (migration mode)</li>
<li><code>STRICT</code> — mTLS only</li>
</ul>
Rollout: start PERMISSIVE, validate all services work, migrate to STRICT namespace by namespace.`
  },

  // ── Resiliency / Observability ────────────────────────────────
  {
    id: "res-01",
    category: "resiliency",
    q: "What are the three types of probes and what does each do?",
    a: `<strong>Liveness</strong> — "Is the container stuck/deadlocked?" Failure → <strong>restart container</strong>.<br><br>
<strong>Readiness</strong> — "Can it handle traffic right now?" Failure → <strong>remove from Service endpoints</strong> (no restart).<br><br>
<strong>Startup</strong> — "Has it finished initializing?" Disables liveness/readiness until it passes. Protects slow-starting apps from premature kills.<br><br>
<strong>Common mistake:</strong> using the same endpoint for liveness and readiness.`
  },
  {
    id: "res-02",
    category: "resiliency",
    q: "What is a Pod Disruption Budget (PDB)?",
    a: `Controls how many pods can be unavailable during <strong>voluntary disruptions</strong> (node drain, cluster upgrade, autoscaling down).<br><br>
Set either:<ul>
<li><code>minAvailable: 2</code> — at least 2 pods must always be running</li>
<li><code>maxUnavailable: 1</code> — at most 1 pod can be down at a time</li>
</ul>
Without PDBs, a drain could take <strong>all your pods down simultaneously</strong>.`
  },
  {
    id: "res-03",
    category: "resiliency",
    q: "Explain resource requests vs limits and QoS classes.",
    a: `<strong>Requests</strong> — guaranteed minimum. Used by scheduler for placement.<br>
<strong>Limits</strong> — ceiling. CPU is throttled; memory exceeding limit = OOMKilled.<br><br>
<strong>QoS Classes</strong> (automatic):<ul>
<li><strong>Guaranteed</strong> — requests == limits. Last to be evicted.</li>
<li><strong>Burstable</strong> — requests < limits. Middle priority.</li>
<li><strong>BestEffort</strong> — no requests or limits. First to be evicted.</li>
</ul>
Best practice: always set both. Requests ≈ normal usage, Limits = reasonable ceiling.`
  },
  {
    id: "res-04",
    category: "resiliency",
    q: "What are the three pillars of observability?",
    a: `<strong>Metrics</strong> (Prometheus + Grafana) — numerical measurements over time. <em>"What's happening?"</em><br><br>
<strong>Logs</strong> (Loki / ELK) — detailed event records. <em>"Why is it happening?"</em><br><br>
<strong>Traces</strong> (Jaeger / Tempo) — request flow across services. <em>"Where is it happening?"</em><br><br>
Metrics tell you something is wrong, traces tell you where, logs tell you why.`
  },
  {
    id: "res-05",
    category: "resiliency",
    q: "What are SLI, SLO, SLA, and error budgets?",
    a: `<strong>SLI</strong> (Service Level Indicator) — the measurement. "99.2% of requests < 200ms"<br><br>
<strong>SLO</strong> (Service Level Objective) — the target. "99.9% of requests should be < 200ms"<br><br>
<strong>SLA</strong> (Service Level Agreement) — the contract with penalties.<br><br>
<strong>Error budget</strong> = allowed unreliability. 99.9% SLO = 0.1% budget ≈ <strong>43 min/month</strong> downtime. Budget healthy → ship fast. Budget depleted → focus on reliability.`
  },
  {
    id: "res-06",
    category: "resiliency",
    q: "RED method vs USE method — when do you use each?",
    a: `<strong>RED Method</strong> (for services):<ul>
<li><strong>R</strong>ate — requests per second</li>
<li><strong>E</strong>rrors — errors per second</li>
<li><strong>D</strong>uration — latency distribution</li>
</ul><br>
<strong>USE Method</strong> (for infrastructure):<ul>
<li><strong>U</strong>tilization — how busy is the resource?</li>
<li><strong>S</strong>aturation — how much queued/waiting work?</li>
<li><strong>E</strong>rrors — error count</li>
</ul>`
  },
  {
    id: "res-07",
    category: "resiliency",
    q: "How do you ensure zero-downtime deployments?",
    a: `<ol>
<li><strong>Rolling update</strong> with <code>maxUnavailable: 0</code> — keep all old pods until new ones are ready</li>
<li><strong>Readiness probes</strong> — only pass when the app can handle traffic</li>
<li><strong>PDBs</strong> — prevent too many pods going down during drains</li>
<li><strong>Pre-stop hooks</strong> with a sleep — allow in-flight requests to complete before termination</li>
<li><strong>Connection draining</strong> in the load balancer / service mesh</li>
</ol>`
  },
  {
    id: "res-08",
    category: "resiliency",
    q: "Your service returns 500 errors intermittently. How do you debug?",
    a: `<ol>
<li><strong>Metrics</strong> — when did it start? Error rate? Correlated with deploys, traffic spikes?</li>
<li><strong>Traces</strong> — find failing requests in Jaeger/Tempo. Which service returns 500s?</li>
<li><strong>Logs</strong> — filter by trace_id. What's the actual error?</li>
<li><strong>Resources</strong> — OOMKills? CPU throttling? Check usage vs limits.</li>
<li><strong>Dependencies</strong> — is a database or external service degraded?</li>
<li><strong>Recent changes</strong> — deployment? Config change?</li>
</ol>`
  },
  {
    id: "res-09",
    category: "resiliency",
    q: "What is circuit breaking and how does Istio implement it?",
    a: `Prevents <strong>cascading failures</strong> by stopping requests to unhealthy services.<br><br>
Istio uses <strong>DestinationRule</strong> with outlier detection:<ul>
<li><code>consecutive5xxErrors: 5</code> — 5 errors in a row</li>
<li><code>interval: 30s</code> — check window</li>
<li><code>baseEjectionTime: 30s</code> — remove from pool for 30s</li>
<li><code>maxEjectionPercent: 50</code> — never eject more than half the endpoints</li>
</ul>
Also set <strong>connection pool limits</strong> and <strong>timeout/retry policies</strong>.`
  },
  {
    id: "res-10",
    category: "resiliency",
    q: "What is the difference between monitoring and observability?",
    a: `<strong>Monitoring</strong> — tells you when <strong>known</strong> failure modes occur. Predefined alerts for expected scenarios.<br><br>
<strong>Observability</strong> — lets you ask <strong>arbitrary questions</strong> about your system's behavior, even ones you didn't anticipate.<br><br>
Monitoring: <em>"Alert me when error rate > 5%"</em><br>
Observability: <em>"Why is this specific user's request slow on Tuesdays?"</em>`
  },
  {
    id: "res-11",
    category: "resiliency",
    q: "Why should you alert on error budget burn rate, not raw metrics?",
    a: `<strong>Bad:</strong> Alert when CPU > 80% — noisy, doesn't mean users are affected.<br><br>
<strong>Good:</strong> Alert when error budget burn rate is too high — directly tied to user impact and SLO.<br><br>
If SLO is 99.9% and you're burning budget 14.4x faster than normal, you'll exhaust it in hours. This creates <strong>actionable, meaningful alerts</strong> instead of false positives.`
  },
  {
    id: "res-12",
    category: "resiliency",
    q: "How would you roll out Istio to 500 existing services?",
    a: `<strong>Never big-bang.</strong> Phased rollout:<br><br>
<strong>Phase 1:</strong> Install control plane. Sidecar on ONE low-risk namespace. Validate latency/breakage.<br><br>
<strong>Phase 2:</strong> Namespace by namespace. Start with "lighthouse" teams. Provide opt-out. Win = free observability.<br><br>
<strong>Phase 3:</strong> mTLS in PERMISSIVE mode. Validate. Then migrate to STRICT per-namespace.<br><br>
<strong>Phase 4:</strong> Advanced features (canary, circuit breaking, AuthorizationPolicies) team by team.<br><br>
Always have an escape hatch.`
  },
  {
    id: "res-13",
    category: "resiliency",
    q: "What is OpenTelemetry (OTel)?",
    a: `<strong>Vendor-neutral standard</strong> for metrics, logs, and traces.<br><br>
<ul>
<li><strong>SDK</strong> — instrumentation libraries for every language</li>
<li><strong>Collector</strong> — receives, processes, and exports telemetry data</li>
<li><strong>Exports to:</strong> Jaeger, Zipkin, Grafana Tempo, cloud providers</li>
</ul>
Flow: App (OTel SDK) → OTel Collector → Jaeger/Tempo (storage) → Grafana (visualization).<br><br>
Service mesh bonus: Istio provides traces automatically for inter-service calls — no code changes.`
  }
];
