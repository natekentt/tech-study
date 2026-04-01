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

  {
    id: "k8s-11",
    category: "k8s",
    q: "What happens when a node runs out of disk space?",
    a: `The kubelet monitors disk via <strong>eviction thresholds</strong>:<ul>
<li><code>nodefs.available</code> < 10% → soft eviction (grace period)</li>
<li><code>nodefs.available</code> < 5% → hard eviction (immediate)</li>
<li><code>imagefs.available</code> < 15% → garbage collect unused images</li>
</ul>
<strong>What gets cleaned:</strong> Dead containers first, then unused images, then pod eviction by QoS class (BestEffort → Burstable → Guaranteed).<br><br>
<strong>Node goes NotReady</strong> if disk pressure persists. Kubelet sets <code>DiskPressure</code> condition and scheduler stops placing pods on it.<br><br>
<strong>Prevention:</strong> Set resource limits, use ephemeral storage limits (<code>ephemeral-storage</code>), monitor with Prometheus <code>node_filesystem_avail_bytes</code>.`
  },
  {
    id: "k8s-12",
    category: "k8s",
    q: "What is the difference between resource requests and limits for CPU vs memory?",
    a: `<strong>CPU:</strong><ul>
<li><strong>Request</strong> — guaranteed CPU time. Used by scheduler for placement.</li>
<li><strong>Limit</strong> — max CPU. Exceeding it = <strong>throttled</strong> (slowed down, NOT killed).</li>
<li>CPU is <strong>compressible</strong> — you can take it away without crashing.</li>
</ul>
<strong>Memory:</strong><ul>
<li><strong>Request</strong> — guaranteed memory. Used by scheduler.</li>
<li><strong>Limit</strong> — max memory. Exceeding it = <strong>OOMKilled</strong> (hard kill, exit code 137).</li>
<li>Memory is <strong>incompressible</strong> — you can't take it back without killing the process.</li>
</ul>
<strong>Key insight:</strong> Some teams set no CPU limits (only requests) to avoid throttling, since CPU can be shared. Memory limits should <strong>always</strong> be set.`
  },
  {
    id: "k8s-13",
    category: "k8s",
    q: "How does kubectl exec work under the hood?",
    a: `<ol>
<li><code>kubectl</code> sends request to <strong>API Server</strong></li>
<li>API Server authenticates, authorizes (RBAC), checks admission</li>
<li>API Server opens a <strong>SPDY/WebSocket connection</strong> to the <strong>kubelet</strong> on the target node</li>
<li>Kubelet calls the <strong>container runtime</strong> (containerd) via CRI to exec into the container's namespace</li>
<li>stdin/stdout/stderr are streamed back through the chain</li>
</ol>
<strong>Security note:</strong> This is powerful — it's shell access to a running container. Lock it down with RBAC (<code>pods/exec</code> verb). Audit log all exec commands. In production, prefer <strong>ephemeral debug containers</strong> (<code>kubectl debug</code>) over exec.`
  },
  {
    id: "k8s-14",
    category: "k8s",
    q: "What are taints and tolerations? When would you use them?",
    a: `<strong>Taints</strong> go on <strong>nodes</strong> — repel pods unless they tolerate the taint.<br>
<strong>Tolerations</strong> go on <strong>pods</strong> — allow scheduling on tainted nodes.<br><br>
<strong>Effects:</strong><ul>
<li><code>NoSchedule</code> — won't schedule new pods (existing stay)</li>
<li><code>PreferNoSchedule</code> — soft preference, avoid if possible</li>
<li><code>NoExecute</code> — evicts existing pods too</li>
</ul>
<strong>Use cases:</strong><ul>
<li><strong>Dedicated nodes</strong> — GPU nodes tainted so only ML workloads land there</li>
<li><strong>Node draining</strong> — <code>kubectl drain</code> adds NoExecute taint</li>
<li><strong>Infra isolation</strong> — system components tolerate control-plane taints</li>
</ul>`
  },
  {
    id: "k8s-15",
    category: "k8s",
    q: "A pod is stuck in Pending. What are the possible causes?",
    a: `Pending = scheduler can't place the pod. Check <code>kubectl describe pod</code> Events.<br><br>
<strong>Common causes:</strong><ul>
<li><strong>Insufficient resources</strong> — no node has enough CPU/memory for the pod's requests</li>
<li><strong>Node selectors / affinity</strong> — no node matches the required labels</li>
<li><strong>Taints</strong> — all suitable nodes are tainted and pod lacks tolerations</li>
<li><strong>PVC not bound</strong> — PersistentVolumeClaim can't find a matching PV or storage class</li>
<li><strong>ResourceQuota exceeded</strong> — namespace hit its pod/CPU/memory quota</li>
<li><strong>Too many pods</strong> — node at max pod count (default 110/node)</li>
<li><strong>Topology constraints</strong> — pod topology spread can't be satisfied</li>
</ul>
<strong>Fix:</strong> Scale up nodes, adjust requests, relax affinity, or free up quota.`
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

  {
    id: "net-11",
    category: "networking",
    q: "How do you debug DNS issues in Kubernetes?",
    a: `<strong>Symptoms:</strong> Service discovery failing, connection timeouts, <code>Name or service not known</code> errors.<br><br>
<strong>Debug steps:</strong><ol>
<li><code>kubectl exec &lt;pod&gt; -- nslookup &lt;service&gt;</code> — can the pod resolve DNS?</li>
<li>Check <strong>CoreDNS pods</strong> — are they running? <code>kubectl get pods -n kube-system -l k8s-app=kube-dns</code></li>
<li>Check CoreDNS <strong>logs</strong> — look for errors, timeouts, SERVFAIL</li>
<li>Check <code>/etc/resolv.conf</code> in the pod — is it pointing to CoreDNS ClusterIP?</li>
<li><strong>ndots setting</strong> — default is 5, meaning short names get 5 search domain suffixes tried before querying externally. Can cause high DNS traffic.</li>
</ol>
<strong>Common fixes:</strong> Scale up CoreDNS, add NodeLocal DNSCache (DaemonSet), reduce <code>ndots</code> for external-heavy workloads.`
  },
  {
    id: "net-12",
    category: "networking",
    q: "What is the difference between L4 and L7 load balancing?",
    a: `<strong>L4 (Transport)</strong> — routes based on <strong>IP + port</strong>. Fast, simple, no payload inspection.<ul>
<li>K8s Service (kube-proxy / IPVS)</li>
<li>AWS NLB, TCP load balancers</li>
<li>Can't route by path, headers, or hostname</li>
</ul>
<strong>L7 (Application)</strong> — routes based on <strong>HTTP headers, path, hostname, cookies</strong>. More powerful, more overhead.<ul>
<li>Ingress controllers (nginx, Envoy)</li>
<li>Service mesh (Istio VirtualService)</li>
<li>AWS ALB, API gateways</li>
<li>Can do canary routing, A/B testing, auth</li>
</ul>
<strong>Platform choice:</strong> L4 for raw TCP/gRPC performance. L7 for HTTP routing, observability, and traffic management.`
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

  {
    id: "sec-09",
    category: "security",
    q: "What is supply chain security for containers? How do you implement it?",
    a: `Ensuring that the code you wrote is the code that's running — nothing tampered with in between.<br><br>
<strong>Layers:</strong><ul>
<li><strong>Image scanning</strong> — scan for CVEs in CI (Trivy, Snyk, Grype). Block deploys with critical vulns.</li>
<li><strong>Image signing</strong> — sign images with <strong>cosign</strong> (Sigstore). Verify signatures before admission.</li>
<li><strong>Admission enforcement</strong> — webhook that rejects unsigned or unscanned images</li>
<li><strong>Base image policy</strong> — only allow images from trusted registries / approved base images</li>
<li><strong>SBOM</strong> (Software Bill of Materials) — know exactly what's in every image</li>
<li><strong>Least privilege builds</strong> — CI runners have minimal permissions, artifacts are immutable</li>
</ul>
<strong>Key principle:</strong> Trust nothing by default. Verify at every stage from code to runtime.`
  },
  {
    id: "sec-10",
    category: "security",
    q: "How do you implement zero-trust networking in Kubernetes?",
    a: `<strong>Zero trust = never trust, always verify.</strong> Even traffic inside the cluster must be authenticated and authorized.<br><br>
<strong>Implementation:</strong><ol>
<li><strong>mTLS everywhere</strong> — Istio STRICT mode. Every service proves its identity.</li>
<li><strong>AuthorizationPolicies</strong> — explicit allow rules. Service A can call Service B, nothing else.</li>
<li><strong>NetworkPolicies</strong> — L3/L4 default deny. Defense in depth alongside mesh.</li>
<li><strong>RBAC</strong> — least privilege for humans and service accounts.</li>
<li><strong>No implicit trust</strong> — being in the same namespace doesn't grant access.</li>
</ol>
<strong>Layers:</strong> NetworkPolicy (L3/L4) + Istio AuthorizationPolicy (L7) + mTLS (identity). Each layer catches what the others miss.`
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
  },
  {
    id: "res-15",
    category: "resiliency",
    q: "Walk through the pod termination lifecycle. Why does graceful shutdown matter?",
    a: `<ol>
<li>Pod marked for deletion → <strong>removed from Service endpoints immediately</strong> (no new traffic)</li>
<li><strong>preStop hook</strong> runs (if defined) — e.g. <code>sleep 5</code> to let in-flight requests drain</li>
<li><strong>SIGTERM</strong> sent to PID 1 in the container</li>
<li>App has <code>terminationGracePeriodSeconds</code> (default 30s) to shut down cleanly</li>
<li>If still running after grace period → <strong>SIGKILL</strong> (hard kill)</li>
</ol>
<strong>Why it matters:</strong> Without a preStop hook, there's a race condition — kube-proxy may still route traffic to the pod after SIGTERM. The sleep gives iptables rules time to update.<br><br>
<strong>Common mistake:</strong> App doesn't handle SIGTERM → connections dropped mid-request.`
  },
  {
    id: "res-16",
    category: "resiliency",
    q: "A pod is OOMKilled. How do you diagnose and fix it?",
    a: `<strong>Diagnose:</strong><ul>
<li><code>kubectl describe pod</code> → look for <code>OOMKilled</code> in last state, exit code 137</li>
<li><code>kubectl top pod</code> → current memory usage vs limits</li>
<li>Check Grafana/Prometheus: <code>container_memory_working_set_bytes</code> over time</li>
<li>Was it a memory leak (gradual climb) or a spike (sudden burst)?</li>
</ul><br>
<strong>Fix:</strong><ul>
<li><strong>Memory leak</strong> → fix the application code. Profile with language-specific tools.</li>
<li><strong>Undersized limits</strong> → increase <code>resources.limits.memory</code>. Set requests ≈ normal usage, limits = reasonable headroom.</li>
<li><strong>JVM/runtime</strong> → ensure the runtime respects container memory limits (e.g. <code>-XX:MaxRAMPercentage=75</code>)</li>
</ul>
<strong>Key:</strong> OOMKill = hard kill. No graceful shutdown. Data can be lost.`
  },
  {
    id: "res-17",
    category: "resiliency",
    q: "Pod is stuck in CrashLoopBackOff. How do you debug it?",
    a: `CrashLoopBackOff = container starts, crashes, restarts with exponential backoff (10s, 20s, 40s… up to 5min).<br><br>
<strong>Steps:</strong><ol>
<li><code>kubectl describe pod</code> → check <strong>Events</strong> and <strong>Last State</strong> (exit code, reason)</li>
<li><code>kubectl logs &lt;pod&gt; --previous</code> → logs from the <strong>crashed</strong> container</li>
<li>Exit code <strong>1</strong> = app error. Exit code <strong>137</strong> = OOMKilled. Exit code <strong>139</strong> = segfault.</li>
<li>Check if <strong>liveness probe</strong> is too aggressive — killing the container before it's ready</li>
<li>Check <strong>config/secrets</strong> — missing env vars, bad connection strings</li>
<li>Check <strong>image</strong> — wrong tag, missing entrypoint</li>
</ol>
<strong>Quick debug:</strong> Override entrypoint with <code>command: ["sleep", "3600"]</code> to get a shell and inspect.`
  },
  {
    id: "res-18",
    category: "resiliency",
    q: "What happens when etcd loses quorum? How do you prevent and recover?",
    a: `<strong>Impact:</strong> Cluster becomes <strong>read-only</strong>. No new pods, no updates, no scheduling. Existing workloads keep running but can't be modified.<br><br>
<strong>Quorum:</strong> Requires majority of nodes. 3-node cluster tolerates 1 failure. 5-node tolerates 2.<br><br>
<strong>Prevention:</strong><ul>
<li>Run <strong>odd number</strong> of etcd nodes (3 or 5)</li>
<li>Spread across <strong>failure domains</strong> (AZs, racks)</li>
<li>Monitor <strong>disk latency</strong> — etcd is very sensitive to slow disks (use SSDs)</li>
<li>Monitor <strong>leader elections</strong> — frequent elections = instability</li>
<li><strong>Regular backups</strong> with <code>etcdctl snapshot save</code></li>
</ul>
<strong>Recovery:</strong> Restore from backup with <code>etcdctl snapshot restore</code>. Any state changes after the snapshot are lost.`
  },
  {
    id: "res-19",
    category: "resiliency",
    q: "How does the Horizontal Pod Autoscaler (HPA) work? What are the pitfalls?",
    a: `HPA adjusts replica count based on metrics:<br><br>
<code>desiredReplicas = ceil(currentReplicas × (currentMetric / targetMetric))</code><br><br>
<strong>Default metric:</strong> CPU utilization. Can also use memory, custom metrics (requests/sec), or external metrics.<br><br>
<strong>Pitfalls:</strong><ul>
<li><strong>Must set resource requests</strong> — HPA compares usage to requests. No requests = HPA can't calculate.</li>
<li><strong>Cooldown periods</strong> — scale up is fast (3min default), scale down is slow (5min) to prevent flapping</li>
<li><strong>Don't use with VPA simultaneously</strong> on the same metric</li>
<li><strong>JVM/startup time</strong> — if pods take 60s to warm up, HPA may over-scale during a spike</li>
<li><strong>CPU isn't always the bottleneck</strong> — use custom metrics (queue depth, request latency) for better signals</li>
</ul>`
  },
  {
    id: "res-20",
    category: "resiliency",
    q: "What is chaos engineering? How would you introduce it?",
    a: `<strong>Deliberately inject failures</strong> to find weaknesses before they cause outages in production.<br><br>
<strong>Process:</strong><ol>
<li>Define <strong>steady state</strong> — what does "normal" look like? (error rate, latency, throughput)</li>
<li><strong>Hypothesize</strong> — "If we kill pod X, traffic should failover to healthy pods"</li>
<li><strong>Inject failure</strong> — pod kill, network partition, latency injection, disk fill</li>
<li><strong>Observe</strong> — did the system behave as expected?</li>
<li><strong>Fix</strong> — address any weaknesses found</li>
</ol>
<strong>Tools:</strong> Chaos Monkey, Litmus Chaos, Gremlin, Chaos Mesh.<br><br>
<strong>Introduce gradually:</strong> Start in staging. Start with simple experiments (kill a pod). Build confidence. Then run in production during business hours with the team watching.`
  },
  {
    id: "res-21",
    category: "resiliency",
    q: "How do you run a blameless postmortem?",
    a: `<strong>Within 48 hours</strong> of the incident:<br><br>
<strong>Structure:</strong><ul>
<li><strong>Timeline</strong> — what happened, when, who did what</li>
<li><strong>Impact</strong> — users affected, duration, SLO burn</li>
<li><strong>Root cause</strong> — not "who" but "what systemic issue allowed this"</li>
<li><strong>What went well</strong> — detection, response, communication</li>
<li><strong>What didn't go well</strong> — gaps in monitoring, slow detection, missing runbooks</li>
<li><strong>Action items</strong> — concrete, assigned, with deadlines</li>
</ul>
<strong>Key principle:</strong> People don't cause incidents — systems allow them. Focus on making the system safer, not punishing individuals.<br><br>
<strong>Action items should prevent recurrence</strong>, not just fix the symptom.`
  },
  {
    id: "res-22",
    category: "resiliency",
    q: "What is toil and how do you reduce it?",
    a: `<strong>Toil</strong> = manual, repetitive, automatable work that scales linearly with service growth and has no lasting value.<br><br>
<strong>Examples:</strong> manual deployments, hand-editing configs, restarting pods, responding to pages that could be auto-remediated.<br><br>
<strong>Google SRE target:</strong> Engineers should spend <strong>< 50% of time on toil</strong>. Rest on engineering work that reduces future toil.<br><br>
<strong>Reduce by:</strong><ul>
<li>Automate repetitive tasks (operators, scripts, GitOps)</li>
<li>Self-healing systems (reconciliation loops, auto-restart)</li>
<li>Self-service platforms (no tickets for common operations)</li>
<li>Better abstractions (CRDs that hide complexity)</li>
</ul>`
  },
  {
    id: "res-23",
    category: "resiliency",
    q: "Explain node pressure eviction. What gets killed first?",
    a: `When a node runs low on resources (memory, disk, PIDs), the <strong>kubelet</strong> starts evicting pods.<br><br>
<strong>Eviction signals:</strong><ul>
<li><code>memory.available</code> < 100Mi (default)</li>
<li><code>nodefs.available</code> < 10%</li>
<li><code>imagefs.available</code> < 15%</li>
</ul>
<strong>Eviction order:</strong><ol>
<li>Pods exceeding their <strong>requests</strong> (using more than they asked for)</li>
<li><strong>BestEffort</strong> pods (no requests/limits) — killed first</li>
<li><strong>Burstable</strong> pods exceeding requests</li>
<li><strong>Guaranteed</strong> pods — killed last (requests == limits)</li>
</ol>
Within the same QoS class, pods using the most resources relative to their requests are evicted first.<br><br>
<strong>This is why setting resource requests matters</strong> — it determines your pod's survival priority.`
  },
  {
    id: "res-24",
    category: "resiliency",
    q: "What are retry storms and how do you prevent them?",
    a: `When a service is struggling, clients retry failed requests. If every client retries simultaneously, the failing service gets <strong>even more traffic</strong> and collapses further.<br><br>
<strong>Prevention:</strong><ul>
<li><strong>Exponential backoff</strong> — wait longer between each retry (1s, 2s, 4s, 8s...)</li>
<li><strong>Jitter</strong> — add randomness so clients don't all retry at the same instant</li>
<li><strong>Retry budgets</strong> — limit retries to a % of total requests (e.g., only retry 20% of calls)</li>
<li><strong>Circuit breakers</strong> — stop sending requests entirely when failure rate is high</li>
<li><strong>Limit retry depth</strong> — only retry at one layer, not at every hop in a microservice chain</li>
</ul>
<strong>Istio config:</strong> Set <code>retries.attempts</code> and <code>retries.retryOn</code> in VirtualService. Combine with DestinationRule outlier detection.`
  },
  {
    id: "res-25",
    category: "resiliency",
    q: "How do you approach capacity planning for a K8s cluster?",
    a: `<ol>
<li><strong>Measure current usage</strong> — CPU, memory, pod count per node. Look at actual vs requested.</li>
<li><strong>Track growth trends</strong> — requests/sec, storage, new services onboarding</li>
<li><strong>Right-size workloads first</strong> — most clusters are over-requested. Use VPA recommendations to set accurate requests.</li>
<li><strong>Plan for headroom</strong> — N+1 at minimum. Can you lose a node and still schedule everything?</li>
<li><strong>Cluster autoscaler</strong> — scales nodes based on unschedulable pods. Set min/max bounds.</li>
</ol>
<strong>Watch for:</strong><ul>
<li><strong>Resource fragmentation</strong> — nodes 70% allocated but no single pod can fit</li>
<li><strong>IP exhaustion</strong> — pod CIDR range limits how many pods can run</li>
<li><strong>etcd size</strong> — grows with CRDs and custom resources</li>
</ul>`
  },
  {
    id: "res-14",
    category: "resiliency",
    q: "What is Prometheus and how does it work?",
    a: `<strong>Prometheus</strong> is an open-source <strong>metrics monitoring and alerting</strong> system, the de facto standard for Kubernetes observability.<br><br>
<strong>How it works:</strong><ul>
<li><strong>Pull-based</strong> — Prometheus <em>scrapes</em> HTTP endpoints (e.g. <code>/metrics</code>) on a schedule (default 15s)</li>
<li><strong>Time-series DB</strong> — stores metrics as time-stamped values: <code>http_requests_total{method="GET", status="200"} 1234</code></li>
<li><strong>PromQL</strong> — query language to slice/aggregate. E.g. <code>rate(http_requests_total[5m])</code> gives requests/sec over 5 minutes</li>
<li><strong>Alertmanager</strong> — evaluates rules and routes alerts to Slack, PagerDuty, etc.</li>
</ul><br>
<strong>In Kubernetes:</strong> Prometheus discovers scrape targets automatically via <strong>ServiceMonitors</strong> (CRDs from the Prometheus Operator). Pair with <strong>Grafana</strong> for dashboards.<br><br>
<strong>Metric types:</strong> Counter (only goes up), Gauge (goes up/down), Histogram (bucketed distributions), Summary (percentiles).`
  },

  // ── AI for SRE ──────────────────────────────────────────────
  {
    id: "ai-01",
    category: "ai",
    q: "How would you use an AI agent to diagnose a K8s incident?",
    a: `Build an <strong>incident triage agent</strong> with MCP tools that can query your infrastructure:<br><br>
<strong>MCP tools:</strong><ul>
<li><code>kubectl_get</code> — fetch pod status, events, describe output</li>
<li><code>prometheus_query</code> — pull metrics (error rate, latency, CPU, memory)</li>
<li><code>loki_query</code> — search logs by namespace, pod, trace ID</li>
<li><code>argocd_status</code> — check recent deployments and sync status</li>
</ul>
<strong>Workflow:</strong> Engineer pages in with "Service X is 500ing." Agent pulls pod events, checks for OOMKills/CrashLoops, queries error rate spike timing, correlates with recent deploys, searches logs for stack traces — and presents a <strong>summary with probable root cause</strong> in seconds instead of 15 minutes of manual kubectl/Grafana digging.<br><br>
<strong>Key:</strong> Agent doesn't fix — it <strong>accelerates diagnosis</strong>. Human decides the action.`
  },
  {
    id: "ai-02",
    category: "ai",
    q: "What is MCP (Model Context Protocol) and why does it matter for platform engineering?",
    a: `<strong>MCP</strong> is an open protocol that lets AI models call external tools through a standardized interface — like USB-C for AI integrations.<br><br>
<strong>How it works:</strong><ul>
<li><strong>MCP Server</strong> — exposes tools (functions) with typed inputs/outputs</li>
<li><strong>MCP Client</strong> — AI model discovers available tools and calls them</li>
<li>Model decides <strong>which tools to call and in what order</strong> based on the user's question</li>
</ul>
<strong>For platform engineering:</strong> Build MCP servers that wrap your internal APIs — K8s, CI/CD, monitoring, secrets, deployment. Engineers can then interact with infrastructure through natural language via Claude/Copilot instead of memorizing 50 CLI tools.<br><br>
<strong>Security:</strong> MCP tools must enforce the same auth/RBAC as the underlying API. Propagate user identity — the agent should only access what the caller is authorized for.`
  },
  {
    id: "ai-03",
    category: "ai",
    q: "How would you build AI-powered runbook automation?",
    a: `<strong>Problem:</strong> Runbooks are docs that engineers follow during incidents. They're often stale, long, and require context-switching between docs and terminals.<br><br>
<strong>Solution:</strong> Encode runbooks as <strong>agent workflows</strong>:<ol>
<li>Alert fires (PagerDuty/Alertmanager)</li>
<li>Agent receives alert context (service, namespace, metric that triggered)</li>
<li>Agent follows runbook steps using MCP tools — checks pod health, queries metrics, inspects logs</li>
<li>Agent executes <strong>safe remediation</strong> (restart pod, scale up replicas, rollback deploy) if within its authority</li>
<li>Agent posts <strong>summary + actions taken</strong> to Slack incident channel</li>
</ol>
<strong>Guardrails:</strong> Read-only by default. Destructive actions require human approval. All actions logged for audit. Agent escalates to human if confidence is low or if the runbook doesn't match the symptoms.`
  },
  {
    id: "ai-04",
    category: "ai",
    q: "How do you use AI to reduce toil in an SRE team?",
    a: `Identify <strong>repetitive, manual tasks</strong> that engineers do daily and build AI-assisted workflows:<br><br>
<strong>High-impact targets:</strong><ul>
<li><strong>Log analysis</strong> — AI summarizes error patterns across thousands of log lines instead of manual grep</li>
<li><strong>PR reviews for infra changes</strong> — AI validates Terraform/K8s manifests against policy before human review</li>
<li><strong>Incident summarization</strong> — agent writes the postmortem timeline from Slack threads + alert history</li>
<li><strong>Capacity reports</strong> — agent queries Prometheus, generates weekly resource utilization reports</li>
<li><strong>Onboarding</strong> — chatbot that answers "how do I deploy X" using your internal docs as context</li>
</ul>
<strong>Approach:</strong> Don't build a general AI platform first. Pick the <strong>one task</strong> that wastes the most hours/week, automate it, prove value, then expand. Same lighthouse team pattern as any platform rollout.`
  },
  {
    id: "ai-05",
    category: "ai",
    q: "How would you design an AI-powered K8s security scanner?",
    a: `An agent that continuously audits cluster security posture:<br><br>
<strong>MCP tools:</strong><ul>
<li><code>kubectl_get</code> — list pods, RBAC roles, network policies, PSS labels</li>
<li><code>trivy_scan</code> — scan running images for CVEs</li>
<li><code>opa_eval</code> — evaluate resources against OPA/Gatekeeper policies</li>
</ul>
<strong>What it checks:</strong><ul>
<li>Pods running as <strong>root</strong> or with privilege escalation</li>
<li>Namespaces missing <strong>NetworkPolicies</strong> (default allow = risk)</li>
<li>RBAC roles with <strong>wildcard permissions</strong></li>
<li>Secrets not sourced from <strong>external secrets manager</strong></li>
<li>Images with <strong>critical CVEs</strong> or no signature</li>
<li>Service accounts with <strong>unnecessary token mounts</strong></li>
</ul>
<strong>Output:</strong> Prioritized report — critical/high/medium — with specific remediation steps. Runs on schedule or on-demand. Posts to Slack or creates Jira tickets.`
  },
  {
    id: "ai-06",
    category: "ai",
    q: "What is context engineering and why does it matter for AI in production?",
    a: `<strong>Context engineering</strong> = designing <em>what information</em> the AI model sees so it produces reliable, accurate results.<br><br>
<strong>Techniques:</strong><ul>
<li><strong>Spec-driven agents</strong> — structured instructions (CLAUDE.md, system prompts) that define behavior, constraints, and output format</li>
<li><strong>Persisted memory</strong> — agent remembers past interactions, decisions, runbook outcomes</li>
<li><strong>Hooks</strong> — pre/post processing steps that validate inputs and outputs</li>
<li><strong>Summarization</strong> — compress long context (logs, metrics) into relevant summaries before sending to the model</li>
<li><strong>Tool descriptions</strong> — clear, typed MCP tool definitions so the model knows exactly what each tool does</li>
</ul>
<strong>Why it matters:</strong> Without context engineering, AI is unreliable — hallucinations, wrong tool calls, missed context. With it, you get <strong>consistent, auditable, trustworthy</strong> AI workflows. This is the difference between a demo and a production system.`
  },
  {
    id: "ai-07",
    category: "ai",
    q: "How would you roll out AI tooling to an SRE org that has no AI adoption?",
    a: `Same pattern as any platform adoption — <strong>start small, prove value, expand:</strong><br><br>
<strong>Phase 1 — Developer workflow (week 1-2):</strong><ul>
<li>Get Claude Code / Copilot into engineers' hands</li>
<li>Build shared spec files (CLAUDE.md) with team conventions, K8s patterns, coding standards</li>
<li>Immediate win: faster PR reviews, IaC generation, debugging</li>
</ul>
<strong>Phase 2 — Internal MCP tools (month 1):</strong><ul>
<li>Build MCP servers for your most-used internal APIs (K8s, monitoring, CI/CD)</li>
<li>Engineers query infrastructure via natural language</li>
</ul>
<strong>Phase 3 — Automated workflows (month 2-3):</strong><ul>
<li>Incident triage agent, security scanner, capacity reporter</li>
<li>Start with read-only. Add write actions with approval gates.</li>
</ul>
<strong>Key:</strong> Don't pitch "AI." Pitch <strong>time saved</strong>. "This saves 2 hours per on-call shift" beats "we're using LLMs" every time.`
  },
  {
    id: "ai-08",
    category: "ai",
    q: "How do you secure AI agents that have access to production infrastructure?",
    a: `AI agents with MCP tools are powerful — and dangerous if not locked down:<br><br>
<strong>Security layers:</strong><ol>
<li><strong>Identity propagation</strong> — agent acts with the caller's identity, not a superuser. RBAC applies to the agent's actions.</li>
<li><strong>Read-only by default</strong> — tools that query are always available. Tools that mutate require explicit approval.</li>
<li><strong>Scope limits</strong> — agent can only access namespaces/clusters the user has access to</li>
<li><strong>Audit logging</strong> — every tool call logged with who triggered it, what was called, inputs, outputs</li>
<li><strong>Rate limiting</strong> — per-user/team token quotas prevent runaway costs and abuse</li>
<li><strong>Hallucination guards</strong> — validate agent outputs against schema. If it generates a kubectl command, parse and verify before executing.</li>
<li><strong>Human-in-the-loop</strong> — destructive actions (delete, scale to zero, rollback) require human confirmation</li>
</ol>
<strong>Principle:</strong> Treat AI agents like any other service — least privilege, audit trail, blast radius limits.`
  },
  {
    id: "ai-09",
    category: "ai",
    q: "Scenario: An engineer asks the AI agent 'Why is checkout slow?' Walk through the agent workflow.",
    a: `<strong>1. Parse intent:</strong> Service = checkout. Problem = high latency.<br><br>
<strong>2. Agent calls MCP tools:</strong><ul>
<li><code>prometheus_query</code>: <code>histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="checkout"}[5m]))</code> → P99 is 4.2s (normally 200ms)</li>
<li><code>kubectl_get</code>: pods in checkout namespace → 2/5 pods in CrashLoopBackOff</li>
<li><code>loki_query</code>: logs from crashing pods → <code>connection refused: payments-db:5432</code></li>
<li><code>argocd_status</code>: payments-db had a config change deployed 20 min ago</li>
</ul>
<strong>3. Agent synthesizes:</strong> "Checkout P99 latency spiked to 4.2s starting 20 min ago. 2 of 5 checkout pods are crash-looping because they can't connect to payments-db. A config change was deployed to payments-db 20 minutes ago — likely the root cause."<br><br>
<strong>4. Suggests action:</strong> "Roll back the payments-db config change? [Approve / Deny]"<br><br>
<strong>Total time: ~30 seconds</strong> vs 15+ minutes of manual investigation.`
  },
  {
    id: "ai-10",
    category: "ai",
    q: "How would you use AI to improve developer onboarding onto a K8s platform?",
    a: `<strong>Problem:</strong> New engineers take weeks to learn internal tooling, deployment patterns, and where to find things.<br><br>
<strong>Solution: Platform knowledge agent</strong> with context from your internal docs:<ul>
<li><strong>Indexed sources</strong> — runbooks, architecture docs, READMEs, CRD schemas, example configs</li>
<li><strong>MCP tools</strong> — can query live cluster state, show real examples of running services</li>
</ul>
<strong>What engineers can ask:</strong><ul>
<li><em>"How do I deploy a new service?"</em> → step-by-step using your actual platform CRDs</li>
<li><em>"What's the pattern for connecting to the shared Kafka cluster?"</em> → pulls from internal docs + shows live examples</li>
<li><em>"Why is my pod pending?"</em> → queries the actual pod, explains the issue</li>
</ul>
<strong>Impact:</strong> Turns weeks of onboarding into hours. Reduces "how do I..." Slack messages. Keeps documentation living and queryable instead of stale wikis nobody reads.`
  },
  {
    id: "ai-11",
    category: "ai",
    q: "What's the difference between using AI as a copilot vs. an agent in SRE?",
    a: `<strong>Copilot</strong> — AI assists a human in real-time. Human drives, AI suggests.<ul>
<li>Code completion while writing Terraform/K8s manifests</li>
<li>Suggesting PromQL queries while debugging</li>
<li>Explaining error messages in context</li>
<li><strong>Always human-in-the-loop</strong></li>
</ul>
<strong>Agent</strong> — AI executes multi-step workflows autonomously with tools.<ul>
<li>Receives an alert, diagnoses, and remediates (with approval)</li>
<li>Runs scheduled security audits</li>
<li>Generates capacity reports from live metrics</li>
<li><strong>Human approves critical actions</strong></li>
</ul>
<strong>Start with copilot</strong> (low risk, immediate value). <strong>Graduate to agents</strong> as trust builds. The copilot phase teaches you what workflows are worth automating.<br><br>
<strong>For PlayStation:</strong> Copilot for day-to-day engineering → MCP tools for infrastructure queries → agents for incident triage and toil automation.`
  },
  {
    id: "ai-12",
    category: "ai",
    q: "How would you build an internal MCP tool marketplace for an engineering org?",
    a: `<strong>Problem:</strong> Teams build AI integrations in silos — duplicate effort, inconsistent quality, no discoverability. Engineers don't know what tools exist.<br><br>
<strong>Architecture:</strong><ul>
<li><strong>MCP Registry</strong> — internal service catalog (think npm for MCP servers). Each tool registered with name, description, input/output schema, owner team, auth requirements.</li>
<li><strong>Hosting</strong> — MCP servers deployed as <strong>containerized services on K8s</strong> (just like any microservice). Each server gets a namespace, health checks, autoscaling. Use an internal MCP Gateway that routes tool calls to the right server.</li>
<li><strong>Discovery</strong> — internal developer portal (Backstage plugin or custom UI) where engineers browse available tools, see docs, usage stats, and connect them to their Claude/Copilot setup.</li>
<li><strong>Publishing</strong> — teams submit MCP servers via PR to a registry repo. CI validates schema, runs tests, checks security (no hardcoded creds, proper auth). Approved → auto-deployed.</li>
</ul>
<strong>Governance:</strong><ul>
<li><strong>Auth</strong> — every tool enforces caller identity via OAuth/OIDC. No god-mode tokens.</li>
<li><strong>Tiers</strong> — read-only tools auto-approved. Write tools require security review.</li>
<li><strong>Usage tracking</strong> — per-tool call counts, latency, error rates, token cost. Helps prioritize investment and catch abuse.</li>
<li><strong>Versioning</strong> — semver for tool schemas. Breaking changes require new version + migration period.</li>
</ul>
<strong>Examples of tools teams would publish:</strong><ul>
<li>Platform team → <code>k8s-query</code>, <code>argocd-deploy</code>, <code>prometheus-query</code></li>
<li>Security team → <code>trivy-scan</code>, <code>vault-secrets</code>, <code>rbac-audit</code></li>
<li>Data team → <code>spark-query</code>, <code>pipeline-status</code></li>
<li>Infra team → <code>terraform-plan</code>, <code>cost-estimate</code></li>
</ul>
<strong>Impact:</strong> Goes from "each team hacks their own AI scripts" to a governed, discoverable ecosystem. Same playbook as internal package registries (NuGet, PyPI) — just for AI tools.`
  },
  {
    id: "ai-13",
    category: "ai",
    q: "What are the production-grade AI tools and frameworks for SRE/platform workflows?",
    a: `<strong>Agent Frameworks:</strong><ul>
<li><strong>Claude Agent SDK</strong> — Anthropic's SDK for building agents with tool use, multi-step reasoning, and guardrails. Native MCP support.</li>
<li><strong>LangGraph</strong> — stateful, multi-agent orchestration with cycles, branching, and human-in-the-loop. Good for complex incident workflows.</li>
<li><strong>CrewAI</strong> — multi-agent framework where agents have roles (e.g., "incident commander," "log analyst"). Agents collaborate on tasks.</li>
</ul>
<strong>MCP Infrastructure:</strong><ul>
<li><strong>MCP TypeScript/Python SDKs</strong> — official SDKs for building MCP servers. Handles transport, auth, schema validation.</li>
<li><strong>Cloudflare MCP Gateway</strong> — hosted MCP server proxy with auth, rate limiting, and logging built in.</li>
</ul>
<strong>AI-Native Observability:</strong><ul>
<li><strong>LangSmith</strong> — traces every LLM call, tool invocation, and agent step. Essential for debugging agent behavior in production.</li>
<li><strong>Arize Phoenix</strong> — open-source LLM observability. Tracks hallucinations, latency, token usage, retrieval quality.</li>
</ul>
<strong>AI for K8s (purpose-built):</strong><ul>
<li><strong>K8sGPT</strong> — scans cluster for issues and explains them in plain English. Integrates with Trivy, Prometheus.</li>
<li><strong>Kubectl AI plugin</strong> — natural language → kubectl commands.</li>
<li><strong>Robusta</strong> — AI-powered K8s troubleshooting. Auto-enriches alerts with pod logs, metrics, and suggested fixes.</li>
</ul>
<strong>Coding Assistants (enterprise):</strong><ul>
<li><strong>Claude Code</strong> — agentic coding with MCP tool support, hooks, persistent memory. Can run in CI.</li>
<li><strong>GitHub Copilot Enterprise</strong> — code completion + codebase-aware chat. Good for IaC and K8s manifests.</li>
</ul>
<strong>Stack recommendation:</strong> Claude Agent SDK or LangGraph for orchestration → MCP servers for tool access → LangSmith for observability → K8sGPT or Robusta for quick wins while building custom agents.`
  }
];
