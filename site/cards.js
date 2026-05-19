const FLASHCARDS = [
  // ── K8s Architecture ──────────────────────────────────────────
  {
    id: "k8s-01",
    category: "k8s", tags: ["apple"],
    q: "What are the four control plane components and what does each do?",
    a: `<strong>API Server</strong> — front door; handles auth, RBAC, admission, persists to etcd. Only component that talks to etcd.<br><br>
<strong>etcd</strong> — distributed key-value store; single source of truth for all cluster state. Uses Raft consensus.<br><br>
<strong>Scheduler</strong> — watches for unscheduled pods, scores nodes (filter → score), assigns pods.<br><br>
<strong>Controller Manager</strong> — runs reconciliation loops (Deployment controller, ReplicaSet controller, Node controller, etc.).`
  },
  {
    id: "k8s-02",
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
    q: "Explain the reconciliation loop. Why is it the most important pattern in Kubernetes?",
    a: `<strong>Watch desired state → Compare to actual state → Act → Repeat.</strong><br><br>
Every controller follows this pattern. It makes Kubernetes <strong>self-healing</strong> and <strong>declarative</strong>. If a pod crashes, the controller notices the mismatch (want 3, have 2) and creates a new one.<br><br>
This is <strong>level-triggered</strong> (react to state) not edge-triggered (react to events) — if an event is missed, the controller still converges on next loop.`
  },
  {
    id: "k8s-04",
    category: "k8s", tags: ["apple"],
    q: "What happens when a node goes down?",
    a: `The <strong>node controller</strong> detects the node is not reporting heartbeats. After a timeout (default ~5 min), it marks the node <code>NotReady</code>.<br><br>
Pods on that node are <strong>evicted</strong> and rescheduled to healthy nodes by the scheduler (if managed by a Deployment/ReplicaSet).<br><br>
Standalone pods without a controller are lost.`
  },
  {
    id: "k8s-05",
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
    q: "What are the three node components and what does each do?",
    a: `<strong>kubelet</strong> — agent on every node. Receives pod specs from API server, ensures containers are running, runs probes, reports status back.<br><br>
<strong>kube-proxy</strong> — maintains iptables/IPVS rules for Service → Pod routing. Enables the Service abstraction. Doesn't proxy traffic directly in modern mode.<br><br>
<strong>Container Runtime</strong> — actually runs containers (containerd, CRI-O). Implements the CRI. Docker deprecated since K8s 1.24.`
  },
  {
    id: "k8s-07",
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
    q: "What is etcd and why is it critical?",
    a: `Distributed <strong>key-value store</strong> — the single source of truth for ALL cluster state (pods, services, secrets, CRDs, everything).<br><br>
Uses <strong>Raft consensus</strong> for leader election and replication. Typically 3 or 5 nodes for quorum.<br><br>
<strong>Only the API Server</strong> talks to etcd directly. If etcd is lost, the cluster state is lost.<br><br>
Protect it: back up regularly, encrypt at rest, restrict network access, monitor disk latency.`
  },
  {
    id: "k8s-09",
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
    q: "What is a Pod? Why is it ephemeral?",
    a: `Smallest deployable unit — <strong>one or more containers</strong> sharing network namespace and storage volumes.<br><br>
Each pod gets a unique cluster IP. Containers in a pod share localhost.<br><br>
<strong>Ephemeral</strong>: when a pod dies, it's gone — replaced, not restarted. A new pod gets a new IP and identity. This is why you need Deployments/ReplicaSets to manage them.`
  },

  {
    id: "k8s-11",
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
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
    category: "k8s", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "systems", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
    q: "How does a request flow from the internet to a pod?",
    a: `DNS → <strong>External Load Balancer</strong> → <strong>Ingress Controller</strong> (routes by host/path) → <strong>Service</strong> (ClusterIP) → <strong>kube-proxy rules</strong> (iptables/IPVS) → <strong>healthy Pod</strong>.<br><br>
With a service mesh, requests additionally pass through the <strong>Envoy sidecar proxy</strong> for observability and policy enforcement.`
  },
  {
    id: "net-03",
    category: "networking", tags: ["apple"],
    q: "What are the four Service types?",
    a: `<strong>ClusterIP</strong> (default) — internal-only virtual IP. Service-to-service communication.<br><br>
<strong>NodePort</strong> — static port on every node (30000-32767). Rarely used in production.<br><br>
<strong>LoadBalancer</strong> — provisions an external cloud LB. One LB per service = expensive at scale.<br><br>
<strong>Headless</strong> (<code>clusterIP: None</code>) — DNS returns individual pod IPs directly. Used with StatefulSets for addressing specific pods.`
  },
  {
    id: "net-04",
    category: "networking", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
    q: "What is a service mesh and how does the sidecar pattern work?",
    a: `A <strong>dedicated infrastructure layer</strong> for service-to-service communication. Handles traffic management, security (mTLS), and observability — <strong>without changing application code</strong>.<br><br>
Every pod gets an <strong>Envoy sidecar proxy</strong> injected automatically. All traffic in/out goes through the proxy. It handles encryption, retries, circuit breaking, metrics.<br><br>
Your app just makes normal HTTP/gRPC calls.`
  },
  {
    id: "net-07",
    category: "networking", tags: ["apple"],
    q: "What are the key Istio resources?",
    a: `<strong>istiod</strong> — control plane (Pilot + Citadel + Galley). Configures proxies, manages certs, validates config.<br><br>
<strong>VirtualService</strong> — routing rules (canary, traffic splitting, retries, timeouts).<br><br>
<strong>DestinationRule</strong> — circuit breaking, connection pools, subset definitions.<br><br>
<strong>PeerAuthentication</strong> — mTLS mode (PERMISSIVE → STRICT).<br><br>
<strong>AuthorizationPolicy</strong> — who can call whom (zero-trust).`
  },
  {
    id: "net-08",
    category: "networking", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
    q: "How does kube-proxy work?",
    a: `Runs on every node. Maintains <strong>iptables or IPVS rules</strong> that route Service traffic to healthy backend pods.<br><br>
Watches the API server for Service and Endpoint changes, updates rules accordingly.<br><br>
In modern setups uses <strong>IPVS</strong> for better performance at scale. Does NOT proxy traffic itself — just sets up kernel rules.`
  },
  {
    id: "net-10",
    category: "networking", tags: ["apple"],
    q: "How does DNS work in Kubernetes?",
    a: `<strong>CoreDNS</strong> runs as a Deployment in the cluster.<br><br>
Every Service gets a DNS entry: <code>&lt;service&gt;.&lt;namespace&gt;.svc.cluster.local</code><br><br>
Short form within the same namespace: just <code>&lt;service&gt;</code><br><br>
<strong>Headless Services</strong> (<code>clusterIP: None</code>): DNS returns pod IPs directly — used with StatefulSets so clients can address specific pods.`
  },

  {
    id: "net-11",
    category: "networking", tags: ["apple"],
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
    category: "networking", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
    q: "What are the three Pod Security Standards (PSS) levels?",
    a: `Replaced PodSecurityPolicies. Applied via <strong>namespace labels</strong>:<br><br>
<strong>Privileged</strong> — no restrictions. Only for system workloads.<br><br>
<strong>Baseline</strong> — prevents known privilege escalations. Good default.<br><br>
<strong>Restricted</strong> — heavily restricted. Best for untrusted workloads.<br><br>
Modes: <code>enforce</code> (block), <code>warn</code> (allow + warn), <code>audit</code> (allow + log).`
  },
  {
    id: "sec-06",
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "security", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
    q: "What are the three types of probes and what does each do?",
    a: `<strong>Liveness</strong> — "Is the container stuck/deadlocked?" Failure → <strong>restart container</strong>.<br><br>
<strong>Readiness</strong> — "Can it handle traffic right now?" Failure → <strong>remove from Service endpoints</strong> (no restart).<br><br>
<strong>Startup</strong> — "Has it finished initializing?" Disables liveness/readiness until it passes. Protects slow-starting apps from premature kills.<br><br>
<strong>Common mistake:</strong> using the same endpoint for liveness and readiness.`
  },
  {
    id: "res-02",
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
    q: "What are the three pillars of observability?",
    a: `<strong>Metrics</strong> (Prometheus + Grafana) — numerical measurements over time. <em>"What's happening?"</em><br><br>
<strong>Logs</strong> (Loki / ELK) — detailed event records. <em>"Why is it happening?"</em><br><br>
<strong>Traces</strong> (Jaeger / Tempo) — request flow across services. <em>"Where is it happening?"</em><br><br>
Metrics tell you something is wrong, traces tell you where, logs tell you why.`
  },
  {
    id: "res-05",
    category: "resiliency", tags: ["apple"],
    q: "What are SLI, SLO, SLA, and error budgets?",
    a: `<strong>SLI</strong> (Service Level Indicator) — the measurement. "99.2% of requests < 200ms"<br><br>
<strong>SLO</strong> (Service Level Objective) — the target. "99.9% of requests should be < 200ms"<br><br>
<strong>SLA</strong> (Service Level Agreement) — the contract with penalties.<br><br>
<strong>Error budget</strong> = allowed unreliability. 99.9% SLO = 0.1% budget ≈ <strong>43 min/month</strong> downtime. Budget healthy → ship fast. Budget depleted → focus on reliability.`
  },
  {
    id: "res-06",
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
    q: "What is the difference between monitoring and observability?",
    a: `<strong>Monitoring</strong> — tells you when <strong>known</strong> failure modes occur. Predefined alerts for expected scenarios.<br><br>
<strong>Observability</strong> — lets you ask <strong>arbitrary questions</strong> about your system's behavior, even ones you didn't anticipate.<br><br>
Monitoring: <em>"Alert me when error rate > 5%"</em><br>
Observability: <em>"Why is this specific user's request slow on Tuesdays?"</em>`
  },
  {
    id: "res-11",
    category: "resiliency", tags: ["apple"],
    q: "Why should you alert on error budget burn rate, not raw metrics?",
    a: `<strong>Bad:</strong> Alert when CPU > 80% — noisy, doesn't mean users are affected.<br><br>
<strong>Good:</strong> Alert when error budget burn rate is too high — directly tied to user impact and SLO.<br><br>
If SLO is 99.9% and you're burning budget 14.4x faster than normal, you'll exhaust it in hours. This creates <strong>actionable, meaningful alerts</strong> instead of false positives.`
  },
  {
    id: "res-12",
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
    category: "resiliency", tags: ["apple"],
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
  },

  // ── Gap fillers — Systems Design ───────────────────────────
  {
    id: "sys-07",
    category: "systems", tags: ["apple"],
    q: "How would you design monitoring for a brand new service on Day 1?",
    a: `<strong>Before deploy:</strong><ul>
<li><strong>ServiceMonitor</strong> CRD — Prometheus auto-discovers your <code>/metrics</code> endpoint</li>
<li><strong>RED dashboards</strong> in Grafana — Rate, Errors, Duration. Template it so every service gets one for free.</li>
<li><strong>Readiness + liveness probes</strong> — health endpoints that actually check dependencies</li>
</ul>
<strong>SLO setup:</strong><ul>
<li>Define <strong>SLIs</strong> — latency P99, error rate, availability</li>
<li>Set <strong>SLOs</strong> — 99.9% availability, P99 < 200ms</li>
<li>Configure <strong>burn rate alerts</strong> — alert when consuming error budget too fast</li>
</ul>
<strong>Traces + Logs:</strong><ul>
<li>OTel SDK or service mesh auto-instrumentation for <strong>distributed traces</strong></li>
<li>Structured JSON logs with <code>trace_id</code>, <code>service</code>, <code>level</code></li>
</ul>
<strong>Goal:</strong> If this service breaks at 3am, the on-call engineer can diagnose it from dashboards alone without reading source code.`
  },
  {
    id: "sys-08",
    category: "systems", tags: ["apple"],
    q: "How would you handle a cluster upgrade across hundreds of services?",
    a: `<strong>Never big-bang.</strong> Phased, tested, reversible:<br><br>
<strong>Prep:</strong><ol>
<li>Check <strong>API deprecations</strong> — run <code>pluto</code> or <code>kubent</code> to find deprecated APIs in manifests</li>
<li>Review <strong>PDBs</strong> — ensure all critical services have them</li>
<li>Test upgrade in <strong>staging</strong> first — run full integration test suite</li>
</ol>
<strong>Rollout:</strong><ol>
<li>Upgrade <strong>control plane</strong> first (API server, scheduler, controller manager)</li>
<li>Upgrade <strong>worker nodes</strong> in waves — canary group (5%), then 25%, 50%, 100%</li>
<li><strong>Cordon + drain</strong> each node — PDBs protect availability during drain</li>
<li>Monitor <strong>error rates, pod restarts, scheduling failures</strong> between waves</li>
</ol>
<strong>Rollback plan:</strong> Keep old node pool until new nodes are validated. If things break, uncordon old nodes and drain new ones.<br><br>
<strong>Communication:</strong> Maintenance window announced. Teams know to watch their services. Shared Slack channel for real-time updates.`
  },
  {
    id: "sys-09",
    category: "systems", tags: ["apple"],
    q: "Explain blue-green vs canary vs rolling deployments.",
    a: `<strong>Rolling (K8s default):</strong><ul>
<li>Gradually replace old pods with new ones</li>
<li>Controlled by <code>maxSurge</code> and <code>maxUnavailable</code></li>
<li>Simple, no extra infra. Rollback = new rollout of old version.</li>
</ul>
<strong>Blue-Green:</strong><ul>
<li>Two full environments — blue (current) and green (new)</li>
<li>Switch traffic all at once (DNS or LB swap)</li>
<li>Instant rollback (switch back to blue). Expensive — 2x resources.</li>
</ul>
<strong>Canary:</strong><ul>
<li>Route a <strong>small %</strong> of real traffic to new version (5% → 25% → 100%)</li>
<li>Monitor error rates between steps</li>
<li>Requires service mesh (Istio VirtualService) or ingress traffic splitting</li>
<li>Most control, best for high-risk changes</li>
</ul>
<strong>Choose:</strong> Rolling for most deploys. Canary for risky changes. Blue-green when you need instant cutover/rollback.`
  },

  // ── Gap fillers — K8s ──────────────────────────────────────
  {
    id: "k8s-16",
    category: "k8s", tags: ["apple"],
    q: "What is a Kubernetes Operator? How is it different from a controller?",
    a: `<strong>Controller</strong> — a reconciliation loop that watches resources and converges actual state to desired state. Built-in examples: Deployment controller, ReplicaSet controller.<br><br>
<strong>Operator</strong> = CRD + custom controller. It extends Kubernetes with <strong>domain-specific knowledge</strong>. The controller knows how to manage a complex application (database, message queue, monitoring stack).<br><br>
<strong>Example:</strong> Prometheus Operator:<ul>
<li>CRDs: <code>Prometheus</code>, <code>ServiceMonitor</code>, <code>AlertmanagerConfig</code></li>
<li>Controller watches these CRDs and creates/configures the actual Prometheus pods, config files, and alert rules</li>
</ul>
<strong>Frameworks:</strong> Operator SDK (Go, Ansible, Helm), Kubebuilder (Go), KUDO.<br><br>
<strong>Key insight:</strong> Operators encode <strong>operational knowledge as code</strong>. Instead of a runbook saying "to scale Postgres, do X, Y, Z" — the operator does it automatically.`
  },
  {
    id: "k8s-17",
    category: "k8s", tags: ["apple"],
    q: "What are init containers and sidecar containers?",
    a: `<strong>Init containers</strong> — run <strong>before</strong> app containers start. Run to completion sequentially.<ul>
<li>Wait for a dependency to be ready</li>
<li>Populate a shared volume with config/data</li>
<li>Run database migrations</li>
<li>If an init container fails, the pod restarts</li>
</ul>
<strong>Sidecar containers</strong> — run <strong>alongside</strong> the app container for the pod's lifetime.<ul>
<li>Envoy proxy (service mesh)</li>
<li>Log shipper (Fluent Bit)</li>
<li>Vault agent (secret injection)</li>
</ul>
<strong>K8s 1.28+:</strong> Native sidecar support via <code>restartPolicy: Always</code> on init containers — they start first but keep running. Solves the ordering problem (sidecar ready before app starts).`
  },
  {
    id: "k8s-18",
    category: "k8s", tags: ["apple"],
    q: "How does pod-to-pod communication work across nodes?",
    a: `Every pod gets a <strong>unique IP</strong> from the pod CIDR. The <strong>CNI plugin</strong> handles routing:<br><br>
<strong>Same node:</strong> Traffic goes through the Linux bridge/veth pair. Fast, no encapsulation needed.<br><br>
<strong>Cross node:</strong> Depends on CNI mode:<ul>
<li><strong>Overlay (VXLAN/Geneve)</strong> — encapsulates pod traffic in UDP packets between nodes. Works everywhere but adds overhead. (Flannel, Calico VXLAN)</li>
<li><strong>BGP routing</strong> — advertises pod CIDRs via BGP to the network fabric. No encapsulation, better performance. Requires network support. (Calico BGP, Cilium)</li>
<li><strong>Cloud routes</strong> — cloud provider manages routing tables. (GKE, EKS VPC CNI — pods get VPC IPs directly)</li>
</ul>
<strong>Key:</strong> The app doesn't know or care which node the target pod is on. The CNI makes it transparent.`
  },

  // ── Gap fillers — Networking ───────────────────────────────
  {
    id: "net-13",
    category: "networking", tags: ["apple"],
    q: "How does Istio traffic management work for fault injection and testing?",
    a: `Istio can inject failures into live traffic for <strong>resilience testing</strong> without changing application code:<br><br>
<strong>Delay injection:</strong><pre><code>apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  http:
  - fault:
      delay:
        percentage:
          value: 10
        fixedDelay: 5s
    route:
    - destination:
        host: payments</code></pre>
10% of requests to payments get a 5s delay. Tests timeout handling.<br><br>
<strong>Abort injection:</strong> Return HTTP 500 for a percentage of traffic. Tests circuit breaker behavior.<br><br>
<strong>Traffic mirroring (shadowing):</strong> Copy live traffic to a new version without affecting users. Great for load testing v2 with real traffic patterns.<br><br>
<strong>Why it matters for SRE:</strong> Test failure handling in production safely. Validate that circuit breakers, retries, and fallbacks actually work.`
  },

  // ── Gap fillers — Security ─────────────────────────────────
  {
    id: "sec-11",
    category: "security", tags: ["apple"],
    q: "What is OPA/Gatekeeper and how does it enforce policy in K8s?",
    a: `<strong>OPA</strong> (Open Policy Agent) — general-purpose policy engine. Policies written in <strong>Rego</strong> language.<br><br>
<strong>Gatekeeper</strong> — K8s-native OPA integration using CRDs:<ul>
<li><strong>ConstraintTemplate</strong> — defines the policy logic (Rego)</li>
<li><strong>Constraint</strong> — applies the template with parameters to specific resources</li>
</ul>
Runs as a <strong>validating admission webhook</strong>. Intercepts API requests and rejects those that violate policy.<br><br>
<strong>Example policies:</strong><ul>
<li>All containers must have resource limits</li>
<li>No images from untrusted registries</li>
<li>All namespaces must have a cost-center label</li>
<li>No privileged containers</li>
<li>Ingress hostnames must be unique</li>
</ul>
<strong>Audit mode:</strong> Can report violations without blocking — useful for rollout. Shift left: run policies in CI too, not just at admission.`
  },

  // ── Gap fillers — Resiliency ───────────────────────────────
  {
    id: "res-26",
    category: "resiliency", tags: ["apple"],
    q: "What is Grafana and how does it fit the observability stack?",
    a: `<strong>Grafana</strong> is the <strong>visualization layer</strong> — dashboards and alerting for all your observability data.<br><br>
<strong>Data sources:</strong><ul>
<li><strong>Prometheus</strong> — metrics (PromQL queries)</li>
<li><strong>Loki</strong> — logs (LogQL queries)</li>
<li><strong>Tempo</strong> — traces (trace ID lookup)</li>
<li>Plus Elasticsearch, CloudWatch, Datadog, etc.</li>
</ul>
<strong>Key features:</strong><ul>
<li><strong>Dashboard as code</strong> — JSON models, versioned in Git, deployed via Grafana Operator or API</li>
<li><strong>Alerting</strong> — can fire alerts directly from dashboard queries (alternative to Alertmanager)</li>
<li><strong>Explore view</strong> — ad-hoc querying across metrics, logs, and traces. Jump from metric spike → correlated logs → trace.</li>
<li><strong>Variables</strong> — template dashboards (dropdown for namespace, service, cluster)</li>
</ul>
<strong>SRE use:</strong> Every service gets a RED dashboard (templated). SLO dashboards show error budget remaining. On-call engineers live in Grafana during incidents.`
  },
  {
    id: "res-27",
    category: "resiliency", tags: ["apple"],
    q: "What is Loki and how is it different from ELK?",
    a: `<strong>Loki</strong> — log aggregation by Grafana Labs. The "Prometheus for logs."<br><br>
<strong>Key difference from ELK:</strong> Loki does <strong>NOT</strong> index log content. It only indexes <strong>labels</strong> (namespace, pod, container). This makes it:<ul>
<li><strong>Cheaper</strong> — far less storage and compute than Elasticsearch</li>
<li><strong>Simpler</strong> — no complex index management</li>
<li><strong>Slower for full-text search</strong> — trades query speed for cost savings</li>
</ul>
<strong>Architecture:</strong><ul>
<li><strong>Promtail</strong> (DaemonSet) — scrapes logs from each node, adds K8s labels</li>
<li><strong>Loki</strong> — stores and queries logs</li>
<li><strong>Grafana</strong> — visualize and search with LogQL</li>
</ul>
<strong>When to use Loki:</strong> You want a lightweight, cost-effective log stack that integrates natively with Prometheus labels and Grafana dashboards.<br><br>
<strong>When to use ELK:</strong> You need fast full-text search across massive log volumes, or complex log analytics.`
  },
  {
    id: "res-28",
    category: "resiliency", tags: ["apple"],
    q: "Walk through an on-call incident from page to resolution.",
    a: `<strong>0:00 — Page fires:</strong> Alertmanager sends PagerDuty alert: "checkout error budget burn rate 10x." Acknowledge immediately.<br><br>
<strong>0:02 — Assess:</strong> Open Grafana RED dashboard for checkout. Error rate spiked from 0.1% to 8%. P99 latency 3x normal. Started 5 min ago.<br><br>
<strong>0:05 — Correlate:</strong> Check Argo CD — a deploy happened 7 min ago. Check traces in Tempo — failing requests all hit payments-service with connection timeouts.<br><br>
<strong>0:08 — Diagnose:</strong> <code>kubectl get pods -n payments</code> — 3/5 pods CrashLoopBackOff. Logs show config parsing error from new ConfigMap.<br><br>
<strong>0:10 — Mitigate:</strong> Revert the payments-service deploy via Argo CD (git revert + sync). Pods come back healthy. Error rate drops.<br><br>
<strong>0:15 — Verify:</strong> Error budget burn rate back to normal. All dashboards green. Update incident Slack channel.<br><br>
<strong>Next day:</strong> Blameless postmortem. Action items: add ConfigMap validation in CI, add integration test for config parsing, improve alert message with deploy correlation.`
  },
  {
    id: "k8s-19",
    category: "k8s", tags: ["apple"],
    q: "How do GPUs work in Kubernetes? When do you need them vs just CPU?",
    a: `<strong>When you need GPUs:</strong><ul>
<li><strong>ML model training/inference</strong> — neural networks, LLMs, computer vision</li>
<li><strong>Video encoding/transcoding</strong></li>
<li><strong>Graphics rendering</strong> (relevant for PlayStation)</li>
</ul>
<strong>When CPU is enough:</strong> API servers, web apps, data pipelines, CI/CD, most platform engineering work. GPU is overkill and expensive for general compute.<br><br>
<strong>How K8s handles GPUs:</strong><ul>
<li>Install <strong>NVIDIA device plugin</strong> (DaemonSet) — exposes GPUs as a schedulable resource</li>
<li>Request in pod spec: <code>resources.limits: nvidia.com/gpu: 1</code></li>
<li>GPUs are <strong>not shareable</strong> by default — one pod gets a whole GPU (unlike CPU which is divisible)</li>
<li><strong>GPU time-slicing</strong> or <strong>MIG (Multi-Instance GPU)</strong> on A100s can share a GPU across pods</li>
</ul>
<strong>Scheduling:</strong> Use <strong>taints + tolerations</strong> to isolate GPU nodes — prevent non-GPU workloads from landing on expensive GPU nodes. Use <strong>node selectors</strong> or <strong>node affinity</strong> to target GPU node pools.<br><br>
<strong>Cost consideration:</strong> GPU nodes are 5-10x more expensive than CPU nodes. Use <strong>cluster autoscaler</strong> to scale GPU node pools to zero when idle. Spot/preemptible instances for training workloads that can tolerate interruption.`
  },

  // ── Java / Spring ───────────────────────────────────────────────
  {
    id: "java-01",
    category: "java", tags: ["apple"],
    q: "Explain the JVM memory model. What lives in the heap vs the stack?",
    a: `<strong>Heap</strong> — shared across all threads. Stores all <strong>object instances</strong> and arrays. Divided into:<ul>
<li><strong>Young Gen</strong> (Eden + Survivor spaces) — short-lived objects</li>
<li><strong>Old Gen (Tenured)</strong> — long-lived objects promoted from Young Gen</li>
<li><strong>Metaspace</strong> (off-heap since Java 8) — class metadata, method bytecode</li>
</ul>
<strong>Stack</strong> — per-thread, stores <strong>frames</strong> for each method call: local variables, operand stack, return address. Primitives and object <em>references</em> live here (but not the objects themselves).<br><br>
<strong>Key distinction:</strong> Heap is GC-managed and shared (thread-safety needed). Stack is thread-private, auto-cleaned on method return.`
  },
  {
    id: "java-02",
    category: "java", tags: ["apple"],
    q: "Compare G1GC and ZGC. When would you choose each?",
    a: `<strong>G1GC</strong> (default since Java 9):<ul>
<li>Divides heap into <strong>regions</strong>, collects "garbage-first" (regions with most garbage)</li>
<li>Pause target: <code>-XX:MaxGCPauseMillis=200</code> (default)</li>
<li>Good balance of throughput and latency for <strong>4–16 GB heaps</strong></li>
</ul>
<strong>ZGC</strong> (production since Java 15):<ul>
<li><strong>Sub-millisecond pauses</strong> regardless of heap size (up to multi-TB)</li>
<li>Concurrent relocation using <strong>colored pointers</strong> + load barriers</li>
<li>Best for <strong>large heaps</strong> and <strong>latency-sensitive</strong> services (payments, real-time APIs)</li>
</ul>
<strong>Choose G1</strong> for general-purpose workloads. <strong>Choose ZGC</strong> when tail latency matters (p99 SLOs) or heap exceeds 16 GB.`
  },
  {
    id: "java-03",
    category: "java", tags: ["apple"],
    q: "What is Spring Boot auto-configuration and how does it work under the hood?",
    a: `Spring Boot scans the classpath and <strong>automatically configures beans</strong> based on what libraries are present.<br><br>
<strong>Mechanism:</strong><ol>
<li><code>@SpringBootApplication</code> includes <code>@EnableAutoConfiguration</code></li>
<li>Loads <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code></li>
<li>Each auto-config class uses <strong>conditional annotations</strong>:<br>
<code>@ConditionalOnClass</code>, <code>@ConditionalOnMissingBean</code>, <code>@ConditionalOnProperty</code></li>
<li>Your explicit <code>@Bean</code> definitions always <strong>take precedence</strong></li>
</ol>
<strong>Example:</strong> If <code>spring-boot-starter-data-jpa</code> is on classpath and a DataSource bean exists, it auto-configures EntityManagerFactory, transaction manager, and Spring Data repositories.`
  },
  {
    id: "java-04",
    category: "java", tags: ["apple"],
    q: "How does the <code>synchronized</code> keyword differ from <code>ReentrantLock</code>?",
    a: `<strong><code>synchronized</code></strong> — intrinsic lock, simpler syntax:<ul>
<li>Automatically released when block exits (even on exception)</li>
<li>Cannot interrupt a thread waiting for the lock</li>
<li>No fairness guarantee</li>
</ul>
<strong><code>ReentrantLock</code></strong> — explicit lock, more control:<ul>
<li><code>tryLock(timeout)</code> — avoids indefinite blocking</li>
<li><code>lockInterruptibly()</code> — can be interrupted while waiting</li>
<li>Fairness policy option (FIFO ordering)</li>
<li><strong>Must</strong> manually unlock in a <code>finally</code> block</li>
<li>Supports multiple <code>Condition</code> objects (vs single wait/notify)</li>
</ul>
<strong>Rule of thumb:</strong> Use <code>synchronized</code> for simple cases. Use <code>ReentrantLock</code> when you need tryLock, fairness, or multiple conditions.`
  },
  {
    id: "java-05",
    category: "java", tags: ["apple"],
    q: "Explain thread pool sizing. How do you configure <code>ThreadPoolExecutor</code> for CPU-bound vs I/O-bound work?",
    a: `<strong>CPU-bound</strong> (compute-heavy, no waiting):<br>
<code>threads = N_cpu + 1</code><br>
Extra thread covers when one is context-switched out.<br><br>
<strong>I/O-bound</strong> (network calls, DB queries, file I/O):<br>
<code>threads = N_cpu × (1 + wait_time / compute_time)</code><br>
Threads spend most time blocking, so you need more to keep CPUs busy.<br><br>
<strong>ThreadPoolExecutor params:</strong><ul>
<li><code>corePoolSize</code> — threads kept alive even when idle</li>
<li><code>maximumPoolSize</code> — upper limit under load</li>
<li><code>workQueue</code> — <code>LinkedBlockingQueue</code> (unbounded, risky) vs <code>ArrayBlockingQueue</code> (bounded, applies backpressure)</li>
<li><code>rejectedExecutionHandler</code> — CallerRunsPolicy is often best (applies backpressure naturally)</li>
</ul>
<strong>Spring:</strong> Use <code>@Async</code> + custom <code>TaskExecutor</code> beans. Never use the default <code>SimpleAsyncTaskExecutor</code> in production (creates unbounded threads).`
  },
  {
    id: "java-06",
    category: "java", tags: ["apple"],
    q: "What is the Spring Bean lifecycle? Walk through creation to destruction.",
    a: `<ol>
<li><strong>Instantiation</strong> — constructor called</li>
<li><strong>Populate properties</strong> — dependency injection (<code>@Autowired</code>, <code>@Value</code>)</li>
<li><strong>BeanNameAware / BeanFactoryAware</strong> — framework callbacks</li>
<li><strong>BeanPostProcessor.postProcessBeforeInitialization</strong></li>
<li><strong>@PostConstruct</strong> / <code>InitializingBean.afterPropertiesSet()</code></li>
<li><strong>BeanPostProcessor.postProcessAfterInitialization</strong> — AOP proxies created here</li>
<li><em>Bean is ready for use</em></li>
<li><strong>@PreDestroy</strong> / <code>DisposableBean.destroy()</code> on shutdown</li>
</ol>
<strong>Key insight:</strong> Step 6 is where Spring creates <strong>AOP proxies</strong> (for <code>@Transactional</code>, <code>@Cacheable</code>, etc.). This is why self-invocation bypasses proxies — the internal call doesn't go through the proxy.`
  },
  {
    id: "java-07",
    category: "java", tags: ["apple"],
    q: "What are virtual threads (Project Loom) and how do they change concurrency?",
    a: `<strong>Virtual threads</strong> (Java 21+) are lightweight, JVM-managed threads that are <strong>not</strong> tied 1:1 to OS threads.<br><br>
<strong>Key properties:</strong><ul>
<li>Millions of virtual threads can run on a small pool of <strong>carrier (platform) threads</strong></li>
<li>When a virtual thread blocks on I/O, it <strong>unmounts</strong> from its carrier — the carrier serves another virtual thread</li>
<li>No need for reactive/async programming to achieve high concurrency</li>
</ul>
<strong>Impact on Spring:</strong><br>
<code>spring.threads.virtual.enabled=true</code> — Tomcat uses virtual threads per request. Simple blocking code now scales like reactive code.<br><br>
<strong>Caveats:</strong><ul>
<li><code>synchronized</code> blocks <strong>pin</strong> the carrier thread — prefer <code>ReentrantLock</code></li>
<li>Thread-local abuse can cause memory issues (millions of threads × large TLS)</li>
<li>CPU-bound work doesn't benefit — still bounded by carrier thread count</li>
</ul>`
  },
  {
    id: "java-08",
    category: "java", tags: ["apple"],
    q: "Explain Spring dependency injection. What are the three injection types and which is preferred?",
    a: `<strong>1. Constructor injection</strong> (preferred):<ul>
<li>Dependencies are <strong>required</strong> and <strong>immutable</strong> (final fields)</li>
<li>Object is always in a valid state after construction</li>
<li>Easy to test — just pass dependencies to constructor</li>
</ul>
<strong>2. Setter injection:</strong><ul>
<li>For <strong>optional</strong> dependencies</li>
<li>Object can exist in partially initialized state</li>
</ul>
<strong>3. Field injection</strong> (<code>@Autowired</code> on fields):<ul>
<li>Concise but <strong>discouraged</strong> — hides dependencies, hard to test, requires reflection</li>
<li>Cannot make fields <code>final</code></li>
</ul>
<strong>Why constructor injection wins:</strong> Enforces required dependencies at compile time, supports immutability, makes circular dependencies obvious (fails fast), and works without Spring (plain Java).`
  },
  {
    id: "java-09",
    category: "java", tags: ["apple"],
    q: "What is the Java Memory Model (JMM)? Explain <code>volatile</code> and happens-before.",
    a: `The <strong>JMM</strong> defines how threads interact through memory and what behaviors are guaranteed.<br><br>
<strong>Problem it solves:</strong> CPUs have caches. Without JMM rules, Thread A's write might not be visible to Thread B.<br><br>
<strong><code>volatile</code></strong>:<ul>
<li>Guarantees <strong>visibility</strong> — reads always see the latest write</li>
<li>Prevents <strong>instruction reordering</strong> around volatile access</li>
<li>Does NOT guarantee atomicity (e.g., <code>volatile int++</code> is still not atomic)</li>
</ul>
<strong>Happens-before</strong> relationships guarantee ordering:<ul>
<li>Thread start → first action in started thread</li>
<li>Unlock of monitor → subsequent lock of same monitor</li>
<li>Write to volatile → subsequent read of same volatile</li>
<li><code>final</code> field writes in constructor → any read of that field after construction</li>
</ul>
<strong>Practical tip:</strong> For atomic counters, use <code>AtomicInteger</code>/<code>LongAdder</code> instead of volatile.`
  },
  {
    id: "java-10",
    category: "java", tags: ["apple"],
    q: "How does Spring Boot handle health checks and readiness/liveness probes?",
    a: `<strong>Spring Boot Actuator</strong> provides health endpoints out of the box:<br><br>
<strong>Liveness</strong> — <code>/actuator/health/liveness</code><ul>
<li>Is the app process alive and not deadlocked?</li>
<li>Returns 200 if the app is running, regardless of dependency health</li>
<li>Failure → Kubernetes <strong>restarts</strong> the pod</li>
</ul>
<strong>Readiness</strong> — <code>/actuator/health/readiness</code><ul>
<li>Can the app serve traffic right now?</li>
<li>Checks DB connections, message brokers, downstream services</li>
<li>Failure → Kubernetes removes pod from <strong>Service endpoints</strong> (no traffic routed)</li>
</ul>
<strong>Configuration:</strong><br>
<code>management.endpoint.health.probes.enabled=true</code><br>
<code>management.health.livenessState.enabled=true</code><br>
<code>management.health.readinessState.enabled=true</code><br><br>
<strong>Custom health indicators:</strong> Implement <code>HealthIndicator</code> interface. Contribute to readiness group via <code>management.endpoint.health.group.readiness.include</code>.`
  },

  // ── APIs at Scale ───────────────────────────────────────────────
  {
    id: "apis-01",
    category: "apis", tags: ["apple"],
    q: "Compare REST and gRPC. When would you choose each?",
    a: `<strong>REST</strong>:<ul>
<li>HTTP/1.1 or HTTP/2, JSON payloads (human-readable)</li>
<li>Browser-friendly, massive ecosystem and tooling</li>
<li>Best for <strong>public APIs</strong>, web clients, third-party integrations</li>
</ul>
<strong>gRPC</strong>:<ul>
<li>HTTP/2 only, Protocol Buffers (binary, 3-10x smaller than JSON)</li>
<li><strong>Bidirectional streaming</strong>, multiplexed connections</li>
<li>Code generation from <code>.proto</code> files — strongly typed client/server stubs</li>
<li>Best for <strong>internal service-to-service</strong> communication, low-latency, high-throughput</li>
</ul>
<strong>Hybrid pattern at scale:</strong> gRPC for internal microservices, REST (via API gateway with gRPC-JSON transcoding) for external clients.<br><br>
<strong>Key tradeoff:</strong> gRPC is faster and more efficient, but harder to debug (binary), less browser support, and requires more tooling.`
  },
  {
    id: "apis-02",
    category: "apis", tags: ["apple"],
    q: "What is Protocol Buffers (protobuf) and why is it preferred for service-to-service communication?",
    a: `<strong>Protocol Buffers</strong> is Google's language-neutral binary serialization format.<br><br>
<strong>Advantages over JSON:</strong><ul>
<li><strong>3-10x smaller</strong> payload size (binary encoding, field tags instead of names)</li>
<li><strong>20-100x faster</strong> serialization/deserialization</li>
<li><strong>Schema-enforced</strong> — <code>.proto</code> files define the contract</li>
<li><strong>Backward/forward compatible</strong> — field numbers never change, new fields are optional</li>
</ul>
<strong>Schema evolution rules:</strong><ul>
<li>Never reuse a field number</li>
<li>New fields must be optional or have defaults</li>
<li>Use <code>reserved</code> to prevent accidental reuse of removed fields</li>
</ul>
<strong>Example:</strong><br>
<code>message Payment { string id = 1; int64 amount_cents = 2; string currency = 3; }</code><br><br>
<strong>When JSON is still better:</strong> Public APIs, browser clients, human debugging, small/simple payloads.`
  },
  {
    id: "apis-03",
    category: "apis", tags: ["apple"],
    q: "How do you implement rate limiting at scale? Compare token bucket vs sliding window.",
    a: `<strong>Token Bucket:</strong><ul>
<li>Bucket holds up to <code>max_tokens</code>. Tokens added at steady rate. Each request costs 1 token.</li>
<li><strong>Allows bursts</strong> up to bucket size, then throttles to refill rate</li>
<li>Simple, memory-efficient, widely used (AWS API Gateway, Stripe)</li>
</ul>
<strong>Sliding Window Log:</strong><ul>
<li>Store timestamp of each request. Count requests in last N seconds.</li>
<li><strong>Precise</strong> but memory-heavy (stores every timestamp)</li>
</ul>
<strong>Sliding Window Counter</strong> (hybrid):<ul>
<li>Combine current + previous window with weighted overlap</li>
<li>Good precision, fixed memory (two counters per window)</li>
</ul>
<strong>At scale:</strong><ul>
<li>Use <strong>Redis</strong> for distributed rate limiting (atomic INCR + EXPIRE)</li>
<li>Return <code>429 Too Many Requests</code> with <code>Retry-After</code> header</li>
<li>Include <code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code> headers</li>
<li>Apply at <strong>multiple layers</strong>: per-user, per-IP, per-API-key, global</li>
</ul>`
  },
  {
    id: "apis-04",
    category: "apis", tags: ["apple"],
    q: "What are the common pagination strategies? Compare offset, cursor, and keyset.",
    a: `<strong>Offset-based</strong> (<code>?page=3&limit=20</code>):<ul>
<li>Simple, supports jumping to arbitrary page</li>
<li><strong>Problem:</strong> <code>OFFSET 10000</code> scans and discards 10K rows — O(n) performance</li>
<li><strong>Problem:</strong> Insertions between pages cause duplicates or missed items</li>
</ul>
<strong>Cursor-based</strong> (<code>?cursor=eyJpZCI6MTIzfQ==</code>):<ul>
<li>Opaque token encodes position. Client passes it to get next page.</li>
<li><strong>Stable under concurrent writes</strong> — no duplicates or skips</li>
<li>Cannot jump to arbitrary page</li>
</ul>
<strong>Keyset</strong> (<code>WHERE id > 123 ORDER BY id LIMIT 20</code>):<ul>
<li>Cursor-based under the hood, uses indexed column for efficient seek</li>
<li><strong>O(1) performance</strong> regardless of page depth (uses index seek, not scan)</li>
<li>Best for large datasets — the approach used by Stripe, Slack, Twitter APIs</li>
</ul>
<strong>Best practice:</strong> Use cursor/keyset for production APIs. Reserve offset for admin dashboards or small datasets.`
  },
  {
    id: "apis-05",
    category: "apis", tags: ["apple"],
    q: "How should APIs handle partial failures in a microservices architecture?",
    a: `<strong>Core patterns:</strong><br><br>
<strong>1. Circuit Breaker</strong> (Resilience4j, Hystrix):<ul>
<li>Closed → Open (after N failures) → Half-Open (test with one request)</li>
<li>Prevents cascading failures by <strong>failing fast</strong> instead of timing out</li>
</ul>
<strong>2. Bulkhead:</strong><ul>
<li>Isolate resources per dependency (separate thread pools or semaphores)</li>
<li>Slow service X can't exhaust threads needed for service Y</li>
</ul>
<strong>3. Retry with backoff:</strong><ul>
<li>Exponential backoff + <strong>jitter</strong> to avoid thundering herd</li>
<li>Only retry on <strong>transient</strong> failures (5xx, timeouts), not 4xx</li>
</ul>
<strong>4. Timeout budgets:</strong><ul>
<li>Set per-call and total deadline. Propagate remaining budget downstream.</li>
</ul>
<strong>5. Graceful degradation:</strong><ul>
<li>Return <strong>partial results</strong> with degradation headers</li>
<li>Use cached/stale data when upstream is down</li>
<li>Feature flags to disable non-critical paths</li>
</ul>`
  },
  {
    id: "apis-06",
    category: "apis", tags: ["apple"],
    q: "What is API versioning? Compare URL path, query param, and header strategies.",
    a: `<strong>URL path</strong> (<code>/v1/payments</code>):<ul>
<li>Most common, explicit, easy to route at load balancer</li>
<li>Clear which version a client uses. Simple caching.</li>
<li>Downside: URL changes break client bookmarks</li>
</ul>
<strong>Query parameter</strong> (<code>/payments?version=1</code>):<ul>
<li>Optional — can default to latest</li>
<li>Less clean, easy to forget</li>
</ul>
<strong>Header</strong> (<code>Accept: application/vnd.company.v1+json</code>):<ul>
<li>Clean URLs, content negotiation</li>
<li>Harder to test (can't share a URL), harder to cache</li>
</ul>
<strong>Best practices at scale:</strong><ul>
<li>Use <strong>URL path versioning</strong> for simplicity and discoverability</li>
<li>Maintain <strong>N-1 backward compatibility</strong> — support current + previous version</li>
<li>Deprecation headers: <code>Sunset: Sat, 01 Jan 2028 00:00:00 GMT</code></li>
<li>Version the API contract, not every endpoint change — use additive changes when possible</li>
</ul>`
  },
  {
    id: "apis-07",
    category: "apis", tags: ["apple"],
    q: "Explain gRPC streaming modes. When would you use each?",
    a: `gRPC supports <strong>four communication patterns</strong>:<br><br>
<strong>1. Unary</strong> — single request, single response (like REST):<br>
Most common. Use for simple request/response like <code>GetPayment</code>.<br><br>
<strong>2. Server streaming</strong> — client sends one request, server streams responses:<br>
Use for <strong>large result sets</strong>, real-time feeds, log tailing.<br>
Example: <code>ListTransactions</code> returns a stream of transactions.<br><br>
<strong>3. Client streaming</strong> — client streams requests, server sends one response:<br>
Use for <strong>bulk uploads</strong>, aggregation. Client sends events, server responds with summary.<br><br>
<strong>4. Bidirectional streaming</strong> — both sides stream independently:<br>
Use for <strong>real-time collaboration</strong>, chat, multiplayer game state.<br>
Both sides read/write independently — order not guaranteed between streams.<br><br>
<strong>Key advantage:</strong> All modes use a <strong>single HTTP/2 connection</strong> with multiplexed streams — no head-of-line blocking at the HTTP level.`
  },
  {
    id: "apis-08",
    category: "apis", tags: ["apple"],
    q: "How do you design idempotent APIs? Why does it matter for payments?",
    a: `<strong>Idempotency</strong> means calling an API multiple times produces the same result as calling it once.<br><br>
<strong>Implementation pattern:</strong><ol>
<li>Client sends <code>Idempotency-Key</code> header (UUID) with the request</li>
<li>Server checks if key exists in idempotency store (Redis/DB)</li>
<li>If exists → return the <strong>stored response</strong> (don't re-execute)</li>
<li>If new → execute, store response keyed by idempotency key, return result</li>
</ol>
<strong>Why it's critical for payments:</strong><ul>
<li>Network timeouts cause retries — without idempotency, customer gets <strong>double-charged</strong></li>
<li>Mobile clients retry aggressively on flaky connections</li>
<li>Load balancers retry on 502/503</li>
</ul>
<strong>Naturally idempotent:</strong> GET, PUT, DELETE (by definition)<br>
<strong>Needs idempotency key:</strong> POST (creates resources)<br><br>
<strong>Key expiry:</strong> Store idempotency keys for 24-48 hours. After that, same key can create a new resource.`
  },
  {
    id: "apis-09",
    category: "apis", tags: ["apple"],
    q: "What is an API gateway? What responsibilities should it handle?",
    a: `An <strong>API gateway</strong> is the single entry point for all client requests, routing them to appropriate backend services.<br><br>
<strong>Core responsibilities:</strong><ul>
<li><strong>Routing</strong> — direct requests to the correct service based on path/headers</li>
<li><strong>Authentication</strong> — validate JWTs, API keys, OAuth tokens</li>
<li><strong>Rate limiting</strong> — per-client, per-endpoint throttling</li>
<li><strong>TLS termination</strong> — offload HTTPS from backend services</li>
<li><strong>Request/response transformation</strong> — gRPC↔JSON transcoding</li>
<li><strong>Load balancing</strong> — distribute across service instances</li>
</ul>
<strong>What it should NOT do:</strong><ul>
<li>Business logic — belongs in services</li>
<li>Data aggregation — use BFF (Backend for Frontend) pattern instead</li>
</ul>
<strong>Common options:</strong> Kong, AWS API Gateway, Envoy, NGINX, Spring Cloud Gateway<br><br>
<strong>At Apple scale:</strong> API gateway handles millions of TPS. Must be stateless, horizontally scalable, and support canary routing for progressive rollouts.`
  },
  {
    id: "apis-10",
    category: "apis", tags: ["apple"],
    q: "How do you handle API backward compatibility and breaking changes?",
    a: `<strong>Non-breaking (additive) changes</strong> — safe to deploy:<ul>
<li>Adding new optional fields to responses</li>
<li>Adding new endpoints</li>
<li>Adding new optional query parameters</li>
<li>Adding new enum values (if clients handle unknown values)</li>
</ul>
<strong>Breaking changes</strong> — require versioning:<ul>
<li>Removing or renaming fields</li>
<li>Changing field types</li>
<li>Changing URL structure</li>
<li>Making optional fields required</li>
</ul>
<strong>Migration strategy:</strong><ol>
<li><strong>Expand</strong> — add new field alongside old one</li>
<li><strong>Migrate</strong> — move clients to new field (with deprecation warnings)</li>
<li><strong>Contract</strong> — remove old field after migration period</li>
</ol>
<strong>Protobuf advantage:</strong> Field numbers provide natural backward compatibility. New fields with new numbers are ignored by old clients. Never reuse field numbers — use <code>reserved</code>.`
  },

  // ── AWS Cloud-Native ────────────────────────────────────────────
  {
    id: "aws-01",
    category: "aws", tags: ["apple"],
    q: "Compare Aurora, RDS, and DynamoDB. When would you choose each?",
    a: `<strong>RDS</strong> (managed relational DB):<ul>
<li>MySQL, PostgreSQL, SQL Server, etc. — familiar SQL interface</li>
<li>Single-AZ or Multi-AZ (synchronous standby replica)</li>
<li>Best for: <strong>traditional RDBMS workloads</strong> with moderate scale</li>
</ul>
<strong>Aurora</strong> (cloud-native relational):<ul>
<li>MySQL/PostgreSQL compatible but <strong>5x throughput</strong> vs standard RDS</li>
<li>Storage auto-scales to 128 TB, <strong>6-way replication</strong> across 3 AZs</li>
<li><strong>Aurora Serverless v2</strong> — scales to zero, good for variable workloads</li>
<li>Best for: <strong>high-throughput relational</strong> at scale</li>
</ul>
<strong>DynamoDB</strong> (managed NoSQL):<ul>
<li>Key-value + document model, <strong>single-digit ms latency at any scale</strong></li>
<li>Auto-scales read/write capacity. Global tables for multi-region.</li>
<li>Best for: <strong>high-volume key-value lookups</strong>, session stores, event logs</li>
</ul>
<strong>Payments context:</strong> Aurora for transaction ledgers (ACID). DynamoDB for session tokens, idempotency keys.`
  },
  {
    id: "aws-02",
    category: "aws", tags: ["apple"],
    q: "What is EKS and how does it differ from self-managed Kubernetes?",
    a: `<strong>EKS (Elastic Kubernetes Service)</strong> — AWS-managed Kubernetes control plane.<br><br>
<strong>What AWS manages:</strong><ul>
<li>Control plane (API server, etcd, scheduler, controller manager)</li>
<li>Automatic upgrades and patching of control plane</li>
<li>Multi-AZ etcd with automated backups</li>
<li>99.95% SLA for control plane</li>
</ul>
<strong>What you manage:</strong><ul>
<li>Worker nodes (EC2, Fargate, or managed node groups)</li>
<li>Networking (VPC CNI plugin, security groups)</li>
<li>Application workloads and configs</li>
</ul>
<strong>EKS advantages over self-managed:</strong><ul>
<li>No etcd operational burden (the hardest part of running K8s)</li>
<li>IAM integration via <strong>IRSA</strong> (IAM Roles for Service Accounts)</li>
<li>ALB Ingress Controller for native AWS load balancing</li>
<li>Managed node groups with automatic AMI updates</li>
</ul>
<strong>EKS Fargate:</strong> Serverless pods — no nodes to manage at all. Good for batch jobs and variable workloads.`
  },
  {
    id: "aws-03",
    category: "aws", tags: ["apple"],
    q: "Explain Multi-AZ vs Multi-Region. What are the tradeoffs?",
    a: `<strong>Multi-AZ</strong> (within one region):<ul>
<li>AZs are physically separate data centers, 1-2 ms latency between them</li>
<li>Protects against <strong>single datacenter failure</strong></li>
<li><strong>Synchronous</strong> replication feasible (low latency)</li>
<li>Standard for all production workloads — relatively cheap and simple</li>
</ul>
<strong>Multi-Region</strong>:<ul>
<li>Regions are geographically separated (50-200+ ms latency)</li>
<li>Protects against <strong>entire region failure</strong> (rare but catastrophic)</li>
<li>Typically <strong>asynchronous</strong> replication (eventual consistency)</li>
<li>2-3x cost, significant operational complexity</li>
</ul>
<strong>When to go multi-region:</strong><ul>
<li>Global user base needing low latency</li>
<li>Regulatory requirements (data residency)</li>
<li><strong>RPO near-zero</strong> for critical systems (payments, financial services)</li>
</ul>
<strong>Patterns:</strong> Active-passive (one region serves, other is standby) vs Active-active (both serve traffic — much harder, requires conflict resolution).`
  },
  {
    id: "aws-04",
    category: "aws", tags: ["apple"],
    q: "What DR strategies does AWS support? Explain the four tiers.",
    a: `From cheapest/slowest to most expensive/fastest:<br><br>
<strong>1. Backup & Restore</strong> (RPO: hours, RTO: hours):<ul>
<li>S3 cross-region backups, AMI copies, DB snapshots</li>
<li>Cheapest — only pay for storage</li>
</ul>
<strong>2. Pilot Light</strong> (RPO: minutes, RTO: tens of minutes):<ul>
<li>Core infrastructure running (DB replicas), but compute is off</li>
<li>On disaster: scale up compute, switch DNS</li>
</ul>
<strong>3. Warm Standby</strong> (RPO: seconds, RTO: minutes):<ul>
<li>Scaled-down but <strong>fully functional</strong> copy in DR region</li>
<li>On disaster: scale up to production capacity, switch traffic</li>
</ul>
<strong>4. Multi-Site Active-Active</strong> (RPO: ~0, RTO: ~0):<ul>
<li>Full production in both regions, traffic is split</li>
<li>Most expensive but provides <strong>near-zero downtime</strong></li>
<li>Requires data conflict resolution (DynamoDB Global Tables, Aurora Global Database)</li>
</ul>
<strong>For payments:</strong> Warm Standby minimum. Active-Active for critical transaction paths.`
  },
  {
    id: "aws-05",
    category: "aws", tags: ["apple"],
    q: "What is IAM and how do you follow least-privilege in AWS?",
    a: `<strong>IAM (Identity and Access Management)</strong> controls who can do what in AWS.<br><br>
<strong>Core concepts:</strong><ul>
<li><strong>Users</strong> — human identities (avoid long-lived access keys)</li>
<li><strong>Roles</strong> — assumed by services, applications, or federated users</li>
<li><strong>Policies</strong> — JSON documents defining Allow/Deny on resources</li>
<li><strong>Groups</strong> — attach policies to groups, add users to groups</li>
</ul>
<strong>Least privilege principles:</strong><ul>
<li>Start with <strong>zero permissions</strong>, add only what's needed</li>
<li>Use <strong>IAM Access Analyzer</strong> to find unused permissions and generate least-privilege policies</li>
<li><strong>Condition keys</strong> — restrict by IP, time, MFA, source VPC</li>
<li><strong>Resource-level permissions</strong> — scope to specific ARNs, not <code>*</code></li>
<li><strong>Service control policies (SCPs)</strong> — organization-wide guardrails</li>
</ul>
<strong>In EKS:</strong> Use <strong>IRSA</strong> (IAM Roles for Service Accounts) — each pod gets its own IAM role. No shared node-level credentials.`
  },
  {
    id: "aws-06",
    category: "aws", tags: ["apple"],
    q: "How does DynamoDB work under the hood? Explain partitioning and capacity modes.",
    a: `<strong>Architecture:</strong><ul>
<li>Data is <strong>partitioned by hash of partition key</strong> across storage nodes</li>
<li>Each partition handles up to <strong>3000 RCU / 1000 WCU / 10 GB</strong></li>
<li>Partitions are automatically split when limits are reached</li>
</ul>
<strong>Key design:</strong><ul>
<li><strong>Partition key</strong> — determines data placement. Must distribute evenly (avoid hot partitions)</li>
<li><strong>Sort key</strong> — enables range queries within a partition</li>
<li><strong>GSI (Global Secondary Index)</strong> — alternative partition + sort key, separate throughput</li>
<li><strong>LSI (Local Secondary Index)</strong> — same partition key, different sort key</li>
</ul>
<strong>Capacity modes:</strong><ul>
<li><strong>Provisioned</strong> — you set RCU/WCU. Use auto-scaling. Cheaper for predictable workloads.</li>
<li><strong>On-Demand</strong> — auto-scales instantly, pay per request. Best for unpredictable or spiky traffic.</li>
</ul>
<strong>Anti-pattern:</strong> Using a low-cardinality partition key (e.g., <code>status</code>) creates hot partitions. Use composite keys or write sharding.`
  },
  {
    id: "aws-07",
    category: "aws", tags: ["apple"],
    q: "What are VPCs, subnets, and security groups? How do they provide network isolation?",
    a: `<strong>VPC (Virtual Private Cloud)</strong> — your isolated network in AWS. You define the IP range (CIDR block).<br><br>
<strong>Subnets:</strong><ul>
<li><strong>Public subnet</strong> — has route to Internet Gateway (IGW). For load balancers, bastion hosts.</li>
<li><strong>Private subnet</strong> — no direct internet access. For app servers, databases. Uses NAT Gateway for outbound.</li>
<li>Span a single AZ. Deploy across multiple AZs for HA.</li>
</ul>
<strong>Security Groups</strong> (stateful firewall):<ul>
<li>Applied to <strong>ENIs</strong> (network interfaces on EC2, RDS, etc.)</li>
<li><strong>Allow rules only</strong> — no explicit deny (default deny all inbound)</li>
<li>Stateful — return traffic automatically allowed</li>
<li>Can reference other security groups (e.g., "allow from web-sg")</li>
</ul>
<strong>NACLs</strong> (stateless, subnet-level):<ul>
<li>Allow AND deny rules, evaluated in order</li>
<li>Defense-in-depth layer on top of security groups</li>
</ul>
<strong>Best practice:</strong> Private subnets for all workloads. ALB in public subnet terminates traffic and forwards to private.`
  },
  {
    id: "aws-08",
    category: "aws", tags: ["apple"],
    q: "How does Aurora Global Database work for multi-region?",
    a: `<strong>Aurora Global Database</strong> spans multiple AWS regions with a single Aurora cluster.<br><br>
<strong>Architecture:</strong><ul>
<li><strong>Primary region</strong> — handles all writes</li>
<li><strong>Secondary regions</strong> (up to 5) — read-only replicas with <strong>&lt;1 second replication lag</strong></li>
<li>Replication is at the <strong>storage layer</strong> (not logical replication) — minimal impact on primary performance</li>
</ul>
<strong>Failover:</strong><ul>
<li><strong>Managed planned failover</strong> — promotes secondary to primary with zero data loss (RPO = 0)</li>
<li><strong>Unplanned failover</strong> — RPO typically &lt;1 second. RTO &lt;1 minute.</li>
<li>Applications reconnect automatically via Global Database endpoints</li>
</ul>
<strong>Write forwarding:</strong> Secondary regions can forward writes to primary (adds latency but simplifies app logic).<br><br>
<strong>Payments use case:</strong> Primary in us-east-1 for writes. Read replicas in eu-west-1 and ap-southeast-1 for global read performance. Failover for DR.`
  },
  {
    id: "aws-09",
    category: "aws", tags: ["apple"],
    q: "What is AWS Lambda? When is serverless the right choice vs containers?",
    a: `<strong>Lambda</strong> — event-driven, serverless compute. Upload code, AWS manages everything else.<br><br>
<strong>Choose Lambda when:</strong><ul>
<li>Event-driven workloads (S3 triggers, API Gateway, SQS, DynamoDB streams)</li>
<li>Short-lived tasks (&lt;15 min timeout)</li>
<li>Variable/spiky traffic (scale to zero, instant scale up)</li>
<li>Glue logic between AWS services</li>
</ul>
<strong>Choose containers (EKS/ECS) when:</strong><ul>
<li>Long-running processes or persistent connections</li>
<li>Complex dependency trees or large runtimes</li>
<li>Need GPU, high memory, or specific OS features</li>
<li>Predictable high-throughput (containers are cheaper at sustained load)</li>
</ul>
<strong>Lambda gotchas:</strong><ul>
<li><strong>Cold starts</strong> — first invocation is slow (mitigate with provisioned concurrency)</li>
<li><strong>Concurrency limits</strong> — default 1000/region. Request increase for production.</li>
<li><strong>Stateless</strong> — must use external state (DynamoDB, S3, ElastiCache)</li>
</ul>
<strong>For payments:</strong> Lambda for async events (notifications, webhooks). Containers for core transaction processing (predictable latency).`
  },
  {
    id: "aws-10",
    category: "aws", tags: ["apple"],
    q: "How do you implement observability in AWS? What services form the stack?",
    a: `<strong>AWS-native observability stack:</strong><br><br>
<strong>Metrics — CloudWatch:</strong><ul>
<li>Default metrics for all AWS services (CPU, network, errors)</li>
<li>Custom metrics via <code>PutMetricData</code> API or CloudWatch agent</li>
<li>CloudWatch Alarms → SNS → PagerDuty/Lambda for alerting</li>
</ul>
<strong>Logs — CloudWatch Logs:</strong><ul>
<li>Log groups per service. Log Insights for SQL-like querying.</li>
<li>Stream to S3/Elasticsearch for long-term analysis</li>
<li>Structured JSON logging for efficient querying</li>
</ul>
<strong>Traces — AWS X-Ray:</strong><ul>
<li>Distributed tracing across Lambda, API Gateway, EKS, etc.</li>
<li>Service maps showing dependencies and latency bottlenecks</li>
<li>Trace sampling to manage cost</li>
</ul>
<strong>Enhanced with open source:</strong><ul>
<li><strong>Amazon Managed Prometheus (AMP)</strong> — for K8s metrics</li>
<li><strong>Amazon Managed Grafana (AMG)</strong> — dashboards</li>
<li><strong>OpenTelemetry (ADOT)</strong> — vendor-neutral instrumentation</li>
</ul>
<strong>Key principle:</strong> Instrument at service boundaries. Correlate metrics, logs, and traces with a shared <code>trace-id</code>.`
  },

  // ── Database Optimization ───────────────────────────────────────
  {
    id: "data-01",
    category: "data", tags: ["apple"],
    q: "Explain the CAP theorem. What tradeoff do real distributed databases make?",
    a: `<strong>CAP Theorem:</strong> A distributed system can guarantee at most <strong>two of three</strong>:<ul>
<li><strong>Consistency</strong> — every read returns the most recent write</li>
<li><strong>Availability</strong> — every request receives a response</li>
<li><strong>Partition tolerance</strong> — system works despite network splits</li>
</ul>
<strong>Reality:</strong> Network partitions <em>will</em> happen, so you must choose between C and A during a partition:<br><br>
<strong>CP systems</strong> (choose consistency):<br>
Refuse to respond if data might be stale. Examples: <strong>etcd, ZooKeeper, HBase, MongoDB (default)</strong><br><br>
<strong>AP systems</strong> (choose availability):<br>
Always respond, even with potentially stale data. Examples: <strong>Cassandra, DynamoDB, CouchDB</strong><br><br>
<strong>Nuance:</strong> Most systems offer <strong>tunable consistency</strong>. DynamoDB offers eventual OR strong consistency per read. Cassandra lets you set quorum levels.<br><br>
<strong>For payments:</strong> Financial transactions need <strong>CP</strong> (consistency). Use strong-read or transactions. Accept higher latency for correctness.`
  },
  {
    id: "data-02",
    category: "data", tags: ["apple"],
    q: "What is database sharding? Compare horizontal partitioning strategies.",
    a: `<strong>Sharding</strong> splits data across multiple database instances, each holding a subset of rows.<br><br>
<strong>Strategies:</strong><br>
<strong>1. Hash-based</strong> (<code>shard = hash(key) % N</code>):<ul>
<li>Even distribution, simple routing</li>
<li>Resharding is painful — adding a shard moves ~all data</li>
<li>Fix: <strong>consistent hashing</strong> — only ~1/N keys move on add/remove</li>
</ul>
<strong>2. Range-based</strong> (e.g., A-M → shard1, N-Z → shard2):<ul>
<li>Supports efficient range queries</li>
<li>Risk of <strong>hot shards</strong> if data isn't uniformly distributed</li>
</ul>
<strong>3. Directory-based</strong> (lookup table maps key → shard):<ul>
<li>Most flexible — arbitrary mapping</li>
<li>Lookup table is a single point of failure and bottleneck</li>
</ul>
<strong>Challenges:</strong><ul>
<li><strong>Cross-shard queries</strong> — expensive, require scatter-gather</li>
<li><strong>Cross-shard transactions</strong> — require 2PC (two-phase commit)</li>
<li><strong>Rebalancing</strong> — online resharding is hard (Vitess, ProxySQL)</li>
</ul>
<strong>Avoid sharding as long as possible.</strong> Vertical scaling, read replicas, and caching go a long way.`
  },
  {
    id: "data-03",
    category: "data", tags: ["apple"],
    q: "How do database indexes work? When can they hurt performance?",
    a: `<strong>Index = separate data structure</strong> that maps column values → row locations, enabling fast lookups.<br><br>
<strong>B-tree index</strong> (default in PostgreSQL, MySQL):<ul>
<li>Balanced tree, O(log n) lookups, supports range queries and ordering</li>
<li>Best for: <strong>equality and range queries</strong> on high-cardinality columns</li>
</ul>
<strong>Hash index:</strong><ul>
<li>O(1) lookups for exact match only. No range queries.</li>
</ul>
<strong>Composite index</strong> (<code>CREATE INDEX ON orders(user_id, created_at)</code>):<ul>
<li>Follows <strong>leftmost prefix rule</strong> — index on (A, B, C) helps queries on A, A+B, A+B+C, but NOT B alone</li>
</ul>
<strong>When indexes hurt:</strong><ul>
<li><strong>Write overhead</strong> — every INSERT/UPDATE must update all indexes on the table</li>
<li><strong>Storage cost</strong> — indexes consume disk space</li>
<li><strong>Low-cardinality columns</strong> (e.g., boolean) — full scan may be faster</li>
<li><strong>Unused indexes</strong> — all write cost, no read benefit. Use <code>pg_stat_user_indexes</code> to find them.</li>
</ul>
<strong>Rule:</strong> Index columns that appear in WHERE, JOIN, and ORDER BY clauses of slow queries.`
  },
  {
    id: "data-04",
    category: "data", tags: ["apple"],
    q: "Compare ACID and BASE. When do you choose each?",
    a: `<strong>ACID</strong> (traditional relational DBs):<ul>
<li><strong>Atomicity</strong> — transaction fully completes or fully rolls back</li>
<li><strong>Consistency</strong> — data satisfies all constraints after transaction</li>
<li><strong>Isolation</strong> — concurrent transactions don't interfere</li>
<li><strong>Durability</strong> — committed data survives crashes</li>
</ul>
<strong>BASE</strong> (distributed NoSQL systems):<ul>
<li><strong>Basically Available</strong> — system always responds</li>
<li><strong>Soft state</strong> — data may be in flux</li>
<li><strong>Eventually consistent</strong> — all replicas converge over time</li>
</ul>
<strong>Choose ACID when:</strong><ul>
<li>Financial transactions, payment processing, inventory</li>
<li>Data correctness is non-negotiable</li>
<li>Need complex queries and joins</li>
</ul>
<strong>Choose BASE when:</strong><ul>
<li>Social media feeds, analytics, session data</li>
<li>Availability and partition tolerance matter more than immediate consistency</li>
<li>Massive scale with simple access patterns</li>
</ul>
<strong>Hybrid approach:</strong> ACID for the payment ledger (Aurora), BASE for the activity feed (DynamoDB).`
  },
  {
    id: "data-05",
    category: "data", tags: ["apple"],
    q: "What are database replication strategies? Compare sync vs async.",
    a: `<strong>Synchronous replication:</strong><ul>
<li>Primary waits for replica to confirm write before acknowledging client</li>
<li><strong>Zero data loss</strong> (RPO = 0) — replica always has latest data</li>
<li><strong>Higher latency</strong> — write takes as long as slowest replica</li>
<li>Used by: Aurora (within region), PostgreSQL synchronous standby</li>
</ul>
<strong>Asynchronous replication:</strong><ul>
<li>Primary acknowledges immediately, streams changes to replicas in background</li>
<li><strong>Replication lag</strong> — replicas may be seconds behind</li>
<li><strong>Lower latency</strong> on writes, but risk of data loss on primary failure</li>
<li>Used by: MySQL default replication, Aurora cross-region</li>
</ul>
<strong>Semi-synchronous:</strong><ul>
<li>Wait for <strong>at least one replica</strong> to confirm, not all</li>
<li>Balance between durability and latency</li>
</ul>
<strong>Patterns:</strong><ul>
<li><strong>Single-leader</strong> — one primary handles writes, replicas serve reads</li>
<li><strong>Multi-leader</strong> — multiple primaries (complex conflict resolution)</li>
<li><strong>Leaderless</strong> — any node accepts writes (Cassandra, DynamoDB)</li>
</ul>
<strong>Read-after-write consistency:</strong> Route a user's reads to the primary (or a sync replica) immediately after they write.`
  },
  {
    id: "data-06",
    category: "data", tags: ["apple"],
    q: "What is query optimization? How do you read an EXPLAIN plan?",
    a: `<strong>EXPLAIN</strong> shows the database's <strong>execution plan</strong> for a query — how it will access data.<br><br>
<strong>Key things to look for:</strong><ul>
<li><strong>Seq Scan</strong> (full table scan) — bad for large tables. Add an index.</li>
<li><strong>Index Scan / Index Only Scan</strong> — good, using the index efficiently</li>
<li><strong>Nested Loop</strong> — fine for small outer table, bad for large × large joins</li>
<li><strong>Hash Join</strong> — good for large equi-joins with enough memory</li>
<li><strong>Sort</strong> — check if an index can eliminate the sort</li>
<li><strong>Rows</strong> — estimated vs actual (run <code>EXPLAIN ANALYZE</code>). Large discrepancy = stale statistics → run <code>ANALYZE</code></li>
</ul>
<strong>Common optimizations:</strong><ul>
<li>Add covering indexes (include all columns the query needs)</li>
<li>Rewrite <code>SELECT *</code> to select only needed columns</li>
<li>Use <code>LIMIT</code> with keyset pagination instead of <code>OFFSET</code></li>
<li>Avoid functions on indexed columns in WHERE (<code>WHERE YEAR(date)</code> → <code>WHERE date BETWEEN</code>)</li>
<li>Partition large tables by date or tenant</li>
</ul>`
  },
  {
    id: "data-07",
    category: "data", tags: ["apple"],
    q: "Explain transaction isolation levels. What anomalies does each prevent?",
    a: `From weakest to strongest:<br><br>
<strong>Read Uncommitted:</strong><ul>
<li>Can see uncommitted changes from other transactions (<strong>dirty reads</strong>)</li>
<li>Rarely used in practice</li>
</ul>
<strong>Read Committed</strong> (PostgreSQL default):<ul>
<li>Only sees committed data. Prevents dirty reads.</li>
<li>Still allows <strong>non-repeatable reads</strong> (row changes between two reads in same tx)</li>
</ul>
<strong>Repeatable Read</strong> (MySQL InnoDB default):<ul>
<li>Snapshot at transaction start. Same query returns same rows.</li>
<li>Prevents non-repeatable reads. Still allows <strong>phantom reads</strong> in theory (new rows appear)</li>
</ul>
<strong>Serializable:</strong><ul>
<li>Transactions execute as if serial. Prevents all anomalies.</li>
<li>Highest correctness, <strong>lowest throughput</strong> (most locking/aborts)</li>
</ul>
<strong>Practical choice:</strong> Read Committed for most workloads. Serializable for financial calculations where correctness is paramount. Use <strong>optimistic concurrency control</strong> (version columns) to avoid heavy locking.`
  },
  {
    id: "data-08",
    category: "data", tags: ["apple"],
    q: "What is connection pooling and why is it critical for database performance?",
    a: `<strong>Problem:</strong> Database connections are expensive — each involves TCP handshake, TLS negotiation, authentication, and server-side memory allocation.<br><br>
<strong>Connection pooling</strong> maintains a pool of pre-established connections that are reused across requests.<br><br>
<strong>How it works:</strong><ol>
<li>App requests a connection from the pool</li>
<li>Pool returns an idle connection (or creates new one up to <code>maxPoolSize</code>)</li>
<li>App uses connection, then returns it to the pool</li>
<li>Connection stays open for reuse</li>
</ol>
<strong>Key settings:</strong><ul>
<li><code>minimumIdle</code> — pre-warmed connections (avoid cold start)</li>
<li><code>maximumPoolSize</code> — rule of thumb: <code>2 × CPU cores + disk spindles</code> (usually 10-20)</li>
<li><code>connectionTimeout</code> — how long to wait for a connection before failing</li>
<li><code>maxLifetime</code> — rotate connections to handle DNS changes and DB failovers</li>
</ul>
<strong>Tools:</strong> HikariCP (fastest for Java/Spring), PgBouncer (external for PostgreSQL), RDS Proxy (AWS-managed).<br><br>
<strong>Anti-pattern:</strong> Opening a new connection per request. At 1000 RPS, that's 1000 concurrent DB connections — most DBs cap at a few hundred.`
  },
  {
    id: "data-09",
    category: "data", tags: ["apple"],
    q: "What is database partitioning (table partitioning)? Compare horizontal vs vertical.",
    a: `<strong>Table partitioning</strong> divides a single logical table into smaller physical pieces managed by the database.<br><br>
<strong>Horizontal partitioning</strong> (most common):<ul>
<li>Splits <strong>rows</strong> into partitions based on a column value</li>
<li><strong>Range</strong>: by date (<code>orders_2024_q1</code>, <code>orders_2024_q2</code>) — best for time-series</li>
<li><strong>List</strong>: by category (<code>region = 'US'</code>, <code>region = 'EU'</code>)</li>
<li><strong>Hash</strong>: <code>hash(user_id) % N</code> — even distribution</li>
</ul>
<strong>Vertical partitioning:</strong><ul>
<li>Splits <strong>columns</strong> into separate tables (e.g., separate BLOBs from frequently queried data)</li>
<li>Reduces I/O for queries that only need a few columns</li>
</ul>
<strong>Benefits:</strong><ul>
<li><strong>Partition pruning</strong> — queries only scan relevant partitions</li>
<li>Efficient <strong>data lifecycle</strong> — drop old partitions instead of DELETE (instant, no vacuum)</li>
<li>Parallel query execution across partitions</li>
</ul>
<strong>Key distinction from sharding:</strong> Partitioning is within a <strong>single database</strong>. Sharding is across <strong>multiple database instances</strong>.`
  },
  {
    id: "data-10",
    category: "data", tags: ["apple"],
    q: "How do you handle schema migrations in production without downtime?",
    a: `<strong>Online schema migration</strong> — change schema while serving traffic:<br><br>
<strong>Expand-Contract pattern:</strong><ol>
<li><strong>Expand</strong> — add new column/table (backward compatible). Deploy code that writes to both old and new.</li>
<li><strong>Migrate</strong> — backfill existing data to new schema</li>
<li><strong>Contract</strong> — remove old column/table after all code uses new schema</li>
</ol>
<strong>Safe operations</strong> (non-blocking in PostgreSQL):<ul>
<li>ADD COLUMN with no default (or with DEFAULT in PG 11+)</li>
<li>CREATE INDEX CONCURRENTLY</li>
<li>ADD CONSTRAINT ... NOT VALID, then VALIDATE separately</li>
</ul>
<strong>Dangerous operations</strong> (lock the table):<ul>
<li>Adding a column with a volatile default (pre-PG 11)</li>
<li>RENAME COLUMN (breaks running queries)</li>
<li>Changing column type (full table rewrite)</li>
</ul>
<strong>Tools:</strong> Flyway, Liquibase (migration versioning), gh-ost / pt-online-schema-change (MySQL), pgroll (PostgreSQL).<br><br>
<strong>Rule:</strong> Every migration must be <strong>backward compatible</strong>. Old and new code must work simultaneously during rollout.`
  },

  // ── Payments & Commerce ─────────────────────────────────────────
  {
    id: "pay-01",
    category: "payments", tags: ["apple"],
    q: "Why is idempotency critical in payment systems? How do you implement it?",
    a: `<strong>The problem:</strong> Network failures cause retries. Without idempotency, a payment request retried 3 times could charge the customer 3 times.<br><br>
<strong>Implementation:</strong><ol>
<li>Client generates a unique <code>Idempotency-Key</code> (UUID) before the first attempt</li>
<li>Server stores: <code>key → {status, request_hash, response}</code> in a durable store</li>
<li>On retry with same key:<ul>
<li>If original is <strong>completed</strong> → return stored response</li>
<li>If original is <strong>in-progress</strong> → return 409 Conflict (prevent concurrent execution)</li>
<li>If request body differs → return 422 (key reuse with different request)</li>
</ul></li>
</ol>
<strong>Storage:</strong> Use a separate <code>idempotency_keys</code> table with TTL (24-48h). DynamoDB is ideal (fast key-value lookup, TTL built-in).<br><br>
<strong>Stripe's approach:</strong> Idempotency keys stored in ACID database alongside the payment record in the same transaction — guarantees atomicity between idempotency check and payment execution.`
  },
  {
    id: "pay-02",
    category: "payments", tags: ["apple"],
    q: "What is the Saga pattern? How does it handle distributed transactions?",
    a: `<strong>Problem:</strong> In microservices, a business transaction spans multiple services. Traditional distributed transactions (2PC) don't scale and create tight coupling.<br><br>
<strong>Saga</strong> — a sequence of local transactions, each publishing an event that triggers the next step. If a step fails, <strong>compensating transactions</strong> undo previous steps.<br><br>
<strong>Two coordination approaches:</strong><br><br>
<strong>Choreography</strong> (event-driven):<ul>
<li>Each service listens for events and acts independently</li>
<li>Simple for 2-3 steps. Hard to debug with many steps (no central view)</li>
</ul>
<strong>Orchestration</strong> (central coordinator):<ul>
<li>Orchestrator service directs the flow, tells each service what to do</li>
<li>Easier to understand and debug. Single point of control.</li>
<li>Preferred for <strong>payment flows</strong></li>
</ul>
<strong>Payment example:</strong><ol>
<li>Reserve funds (Payment Service)</li>
<li>Reserve inventory (Inventory Service)</li>
<li>Create order (Order Service)</li>
<li>If step 3 fails → compensate: release inventory, release funds</li>
</ol>
<strong>Key:</strong> Every step must have a compensating action. Design compensations to be idempotent.`
  },
  {
    id: "pay-03",
    category: "payments", tags: ["apple"],
    q: "Explain event sourcing. Why is it used in financial systems?",
    a: `<strong>Event sourcing</strong> stores every state change as an <strong>immutable event</strong> rather than overwriting current state.<br><br>
<strong>Traditional:</strong> Account balance = $100 (overwrite on each transaction)<br>
<strong>Event sourced:</strong><ol>
<li>AccountCreated {balance: 0}</li>
<li>FundsDeposited {amount: 200}</li>
<li>PaymentProcessed {amount: -50}</li>
<li>RefundIssued {amount: -50}</li>
</ol>
Current state = replay all events = $100<br><br>
<strong>Why financial systems love it:</strong><ul>
<li><strong>Complete audit trail</strong> — every change is recorded, nothing is lost</li>
<li><strong>Temporal queries</strong> — "what was the balance at 3pm yesterday?"</li>
<li><strong>Debugging</strong> — replay events to reproduce any past state</li>
<li><strong>Regulatory compliance</strong> — immutable log satisfies audit requirements</li>
</ul>
<strong>Challenges:</strong><ul>
<li><strong>Event schema evolution</strong> — old events must remain deserializable</li>
<li><strong>Performance</strong> — replaying millions of events is slow. Use <strong>snapshots</strong> (periodic materialized state).</li>
<li><strong>Eventual consistency</strong> — read models (projections) lag behind writes</li>
</ul>`
  },
  {
    id: "pay-04",
    category: "payments", tags: ["apple"],
    q: "How do you achieve exactly-once processing in a distributed payment system?",
    a: `<strong>True exactly-once is impossible</strong> in distributed systems (proven by the Two Generals' Problem). Instead, we achieve <strong>effectively exactly-once</strong> through:<br><br>
<strong>At-least-once delivery + idempotent processing = effectively exactly-once</strong><br><br>
<strong>Pattern:</strong><ol>
<li><strong>Producer</strong> retries on failure (at-least-once delivery)</li>
<li><strong>Consumer</strong> deduplicates using a unique message ID:<ul>
<li>Check if message ID exists in processed set</li>
<li>If yes → skip (already processed)</li>
<li>If no → process, then record message ID in same transaction as the business logic</li>
</ul></li>
</ol>
<strong>Transactional outbox pattern:</strong><ul>
<li>Write business data AND outbox event in <strong>same DB transaction</strong></li>
<li>Separate process polls outbox and publishes to message broker</li>
<li>Guarantees no lost events and no duplicate processing</li>
</ul>
<strong>Kafka:</strong> Supports exactly-once semantics (EOS) with idempotent producers + transactional consumers. Uses producer ID + sequence numbers for deduplication.`
  },
  {
    id: "pay-05",
    category: "payments", tags: ["apple"],
    q: "What is PCI DSS and how does it affect system architecture?",
    a: `<strong>PCI DSS (Payment Card Industry Data Security Standard)</strong> — mandatory compliance framework for any system that stores, processes, or transmits cardholder data.<br><br>
<strong>Key requirements affecting architecture:</strong><ul>
<li><strong>Network segmentation</strong> — isolate the Cardholder Data Environment (CDE) from other systems</li>
<li><strong>Encryption</strong> — TLS for data in transit, AES-256 for data at rest. Never store CVV.</li>
<li><strong>Tokenization</strong> — replace card numbers with tokens. Minimize PCI scope.</li>
<li><strong>Access control</strong> — MFA, least privilege, unique IDs for all users</li>
<li><strong>Logging & monitoring</strong> — audit trail for all access to cardholder data. 1-year retention.</li>
<li><strong>Vulnerability management</strong> — regular patching, penetration testing, code reviews</li>
</ul>
<strong>Scope reduction strategy:</strong><ul>
<li>Use a <strong>payment processor</strong> (Stripe, Adyen) to handle raw card data</li>
<li>Client-side tokenization (Stripe.js, Apple Pay) — card numbers never touch your servers</li>
<li>Only your payment microservice talks to the processor — isolate it in a separate VPC/namespace</li>
</ul>
<strong>Apple context:</strong> Apple Pay uses device-specific tokens and never exposes actual card numbers to merchants.`
  },
  {
    id: "pay-06",
    category: "payments", tags: ["apple"],
    q: "Explain the payment processing lifecycle from card tap to merchant settlement.",
    a: `<strong>The flow:</strong><ol>
<li><strong>Authorization</strong> — Customer taps Apple Pay. Device sends payment token to merchant → acquirer → card network (Visa/Mastercard) → issuing bank. Bank checks funds, fraud, limits. Returns <strong>auth code</strong> or decline. (~1-2 seconds)</li>
<li><strong>Capture</strong> — Merchant confirms the charge (can be immediate or delayed, e.g., at shipping). Tells acquirer to collect funds.</li>
<li><strong>Clearing</strong> — Card network batches transactions and calculates net amounts between banks. Typically daily.</li>
<li><strong>Settlement</strong> — Actual money movement between issuing bank → card network → acquiring bank → merchant. Takes <strong>1-3 business days</strong>.</li>
</ol>
<strong>Key parties:</strong><ul>
<li><strong>Issuing bank</strong> — customer's bank (issues the card)</li>
<li><strong>Acquiring bank</strong> — merchant's bank (receives payment)</li>
<li><strong>Card network</strong> — Visa/Mastercard (routes and clears)</li>
<li><strong>Payment processor</strong> — technical intermediary (Stripe, Adyen)</li>
</ul>
<strong>Refund:</strong> Reverses the flow. Can be a void (pre-settlement, instant) or refund (post-settlement, 5-10 days).`
  },
  {
    id: "pay-07",
    category: "payments", tags: ["apple"],
    q: "What is the transactional outbox pattern? Why is it essential for payment events?",
    a: `<strong>Problem:</strong> You need to update a database AND publish an event (e.g., "payment completed"). If either fails, your system is inconsistent:<ul>
<li>DB succeeds, event publish fails → downstream never learns about payment</li>
<li>Event published, DB fails → downstream processes a payment that didn't happen</li>
</ul>
<strong>Solution — Transactional Outbox:</strong><ol>
<li>Write the business record AND an outbox event in the <strong>same database transaction</strong></li>
<li>A separate <strong>relay process</strong> reads the outbox table and publishes events to the message broker</li>
<li>After successful publish, mark the outbox record as sent</li>
</ol>
<strong>Implementation options:</strong><ul>
<li><strong>Polling publisher</strong> — periodically query outbox for unsent events</li>
<li><strong>CDC (Change Data Capture)</strong> — Debezium reads the DB transaction log and streams outbox events directly. More efficient, lower latency.</li>
</ul>
<strong>Why essential for payments:</strong><ul>
<li>Guarantees <strong>atomicity</strong> between state change and event</li>
<li>No dual-write problem — single source of truth</li>
<li>Combined with idempotent consumers → <strong>exactly-once semantics</strong></li>
</ul>`
  },
  {
    id: "pay-08",
    category: "payments", tags: ["apple"],
    q: "How do you handle currency and money in code? What are common pitfalls?",
    a: `<strong>Rule #1: NEVER use floating point for money.</strong><br>
<code>0.1 + 0.2 = 0.30000000000000004</code> — IEEE 754 floats cannot represent most decimals exactly.<br><br>
<strong>Best practices:</strong><ul>
<li>Store amounts as <strong>integers in smallest currency unit</strong> (cents, pence): $19.99 → <code>1999</code></li>
<li>Use <code>BigDecimal</code> in Java (with explicit scale and rounding mode)</li>
<li>In databases: <code>DECIMAL(19,4)</code> or <code>BIGINT</code> (cents)</li>
<li>Always store and transmit <strong>currency code</strong> alongside amount (ISO 4217: USD, EUR, JPY)</li>
</ul>
<strong>Currency-specific gotchas:</strong><ul>
<li>Not all currencies have 2 decimal places — JPY has 0, BHD has 3</li>
<li>Always use a currency library that knows this (Java Money API, Dinero.js)</li>
</ul>
<strong>Rounding:</strong><ul>
<li>Use <strong>banker's rounding</strong> (round half to even) — prevents systematic bias</li>
<li>Apply rounding at the <strong>last step</strong> only — intermediate calculations should preserve precision</li>
</ul>
<strong>Display:</strong> Use locale-aware formatters. $1,234.56 (US) vs 1.234,56 € (Germany).`
  },
  {
    id: "pay-09",
    category: "payments", tags: ["apple"],
    q: "What is Apple Pay from a technical architecture perspective?",
    a: `<strong>Apple Pay</strong> is a tokenized, device-level payment system.<br><br>
<strong>How it works:</strong><ol>
<li><strong>Provisioning</strong> — User adds card. Apple sends card details to card network. Network returns a <strong>Device Account Number (DAN)</strong> — a token stored in the <strong>Secure Element</strong> chip.</li>
<li><strong>Transaction</strong> — User authenticates (Face ID/Touch ID). Secure Element generates a <strong>one-time cryptogram</strong> using the DAN + transaction details.</li>
<li><strong>Payment</strong> — Merchant receives a payment token (DAN + cryptogram), NOT the real card number. Forwards to payment processor → card network decrypts and maps to real card → issuing bank authorizes.</li>
</ol>
<strong>Security architecture:</strong><ul>
<li><strong>Secure Element</strong> — hardware-isolated chip. Keys never leave it.</li>
<li><strong>Tokenization</strong> — real card number never stored on device or shared with merchant</li>
<li><strong>Per-transaction cryptogram</strong> — replay attacks impossible</li>
<li><strong>No card data on Apple servers</strong> — Apple doesn't know what you buy</li>
</ul>
<strong>For systems engineers:</strong> The backend must handle token-based payments, integrate with Apple's payment APIs, and support the token lifecycle (provisioning, updates, suspensions).`
  },
  {
    id: "pay-10",
    category: "payments", tags: ["apple"],
    q: "How do you design a payment system for high availability and fault tolerance?",
    a: `<strong>Core principles:</strong><br><br>
<strong>1. Idempotency everywhere:</strong><ul>
<li>Every payment operation must be safely retriable</li>
<li>Unique payment IDs + idempotency keys at every layer</li>
</ul>
<strong>2. State machine for payment lifecycle:</strong><ul>
<li>States: Created → Authorized → Captured → Settled (or Declined/Refunded/Disputed)</li>
<li>Only valid transitions allowed. Persisted atomically.</li>
<li>Enables recovery from any failure by resuming from current state</li>
</ul>
<strong>3. Async where possible:</strong><ul>
<li>Auth is synchronous (customer is waiting). Settlement is async (batch).</li>
<li>Use message queues for downstream processing (notifications, ledger updates, analytics)</li>
</ul>
<strong>4. Multi-region active-passive:</strong><ul>
<li>Primary region handles all writes (payments need strong consistency)</li>
<li>Warm standby in DR region. Failover in minutes.</li>
</ul>
<strong>5. Reconciliation:</strong><ul>
<li>End-of-day reconciliation between your ledger and payment processor</li>
<li>Automated alerts for mismatches. Manual review queue.</li>
</ul>
<strong>6. Circuit breakers per payment provider:</strong><ul>
<li>If Visa is down, route to backup processor or queue for retry</li>
</ul>`
  },

  // ── Kafka & Messaging ──────────────────────────────────────────
  {
    id: "kafka-01",
    category: "kafka", tags: ["apple"],
    q: "How does Kafka work? Explain topics, partitions, and consumer groups.",
    a: `<strong>Topic</strong> — a named log/feed of messages. Like a database table for events.<br><br>
<strong>Partitions</strong> — each topic is split into ordered, append-only logs:<ul>
<li>Messages within a partition have a sequential <strong>offset</strong></li>
<li>Ordering guaranteed <strong>within a partition</strong>, not across partitions</li>
<li>Partition key determines which partition a message goes to (<code>hash(key) % N</code>)</li>
<li>More partitions = more parallelism</li>
</ul>
<strong>Consumer Groups:</strong><ul>
<li>Each partition is consumed by <strong>exactly one consumer</strong> in a group</li>
<li>Adding consumers (up to partition count) increases throughput</li>
<li>Multiple consumer groups can read the same topic independently</li>
<li>Offsets tracked per consumer group — each group has its own position</li>
</ul>
<strong>Brokers:</strong> Kafka servers that store partitions. Partitions are replicated across brokers for durability. One broker is <strong>leader</strong> for each partition, others are followers.`
  },
  {
    id: "kafka-02",
    category: "kafka", tags: ["apple"],
    q: "How does Kafka guarantee message ordering and exactly-once delivery?",
    a: `<strong>Ordering:</strong><ul>
<li>Guaranteed <strong>within a partition only</strong></li>
<li>Use the same partition key for messages that must be ordered (e.g., all events for user-123 go to the same partition)</li>
<li>Global ordering requires a single partition — kills parallelism, rarely needed</li>
</ul>
<strong>Exactly-once semantics (EOS):</strong><br>
<strong>Idempotent producer</strong> (<code>enable.idempotence=true</code>):<ul>
<li>Each producer gets a <strong>Producer ID + sequence number</strong></li>
<li>Broker deduplicates retried messages — no duplicates even on network failures</li>
</ul>
<strong>Transactional producer + consumer:</strong><ul>
<li><code>beginTransaction()</code> → produce messages + commit offsets → <code>commitTransaction()</code></li>
<li>Atomic: either all messages are published AND offsets committed, or none</li>
<li>Consumers set <code>isolation.level=read_committed</code> to only see committed messages</li>
</ul>
<strong>End-to-end:</strong> Idempotent producer (no dups on write) + transactional consumer (atomic read-process-write) = effectively exactly-once.`
  },
  {
    id: "kafka-03",
    category: "kafka", tags: ["apple"],
    q: "Compare Kafka vs SQS vs SNS. When would you choose each?",
    a: `<strong>Kafka:</strong><ul>
<li>Distributed log — messages <strong>retained</strong> (days/weeks), replayable</li>
<li>Multiple consumer groups read independently (fan-out built in)</li>
<li>Ordering within partitions. High throughput (millions msg/sec).</li>
<li>Best for: <strong>event streaming, event sourcing, high-throughput pipelines</strong></li>
</ul>
<strong>SQS (Simple Queue Service):</strong><ul>
<li>Managed queue — messages <strong>deleted after processing</strong></li>
<li>Standard (at-least-once, best-effort order) vs FIFO (exactly-once, strict order)</li>
<li>Dead letter queue built in. Auto-scales infinitely.</li>
<li>Best for: <strong>task queues, decoupling services, job processing</strong></li>
</ul>
<strong>SNS (Simple Notification Service):</strong><ul>
<li>Pub/sub — pushes messages to <strong>multiple subscribers</strong> (SQS, Lambda, HTTP, email)</li>
<li>No persistence — if subscriber is down, message is lost (unless backed by SQS)</li>
<li>Best for: <strong>fan-out notifications, event broadcasting</strong></li>
</ul>
<strong>Common pattern:</strong> SNS → SQS fan-out (each consumer gets its own queue). Use Kafka when you need replay, ordering, or stream processing.`
  },
  {
    id: "kafka-04",
    category: "kafka", tags: ["apple"],
    q: "What are dead letter queues (DLQ) and how do you handle poison messages?",
    a: `<strong>Problem:</strong> A malformed or unprocessable message causes the consumer to crash or retry infinitely, blocking the entire partition.<br><br>
<strong>Dead Letter Queue:</strong> After N failed processing attempts, move the message to a separate DLQ topic/queue for investigation.<br><br>
<strong>Implementation in Kafka:</strong><ol>
<li>Consumer wraps processing in try/catch</li>
<li>Track retry count per message (in headers or external store)</li>
<li>After max retries → produce to <code>topic.DLQ</code></li>
<li>Commit offset and move on — don't block healthy messages</li>
</ol>
<strong>In SQS:</strong> Built-in — configure <code>maxReceiveCount</code> and a DLQ. After N failures, SQS moves it automatically.<br><br>
<strong>DLQ best practices:</strong><ul>
<li>Alert on DLQ depth — messages there need human attention</li>
<li>Include original topic, partition, offset, error reason in DLQ message</li>
<li>Build a <strong>replay tool</strong> — fix the bug, then replay DLQ messages back to the original topic</li>
<li>Set retention on DLQ (don't let it grow forever)</li>
</ul>`
  },
  {
    id: "kafka-05",
    category: "kafka", tags: ["apple"],
    q: "What is consumer lag and how do you monitor Kafka health?",
    a: `<strong>Consumer lag</strong> = difference between the latest produced offset and the consumer's committed offset. It tells you <strong>how far behind</strong> your consumer is.<br><br>
<strong>Why it matters:</strong><ul>
<li>Growing lag = consumer can't keep up with production rate</li>
<li>Causes stale data, delayed notifications, missed SLOs</li>
</ul>
<strong>Key metrics to monitor:</strong><ul>
<li><strong>Consumer lag per partition</strong> — the #1 Kafka metric</li>
<li><strong>Under-replicated partitions</strong> — broker health issue</li>
<li><strong>Request latency</strong> (produce/fetch) — broker performance</li>
<li><strong>ISR (In-Sync Replicas) shrinks</strong> — follower falling behind leader</li>
<li><strong>Consumer group rebalances</strong> — frequency and duration</li>
</ul>
<strong>Fixing high lag:</strong><ul>
<li>Add more consumers (up to partition count)</li>
<li>Increase partitions (requires rebalance)</li>
<li>Optimize consumer processing time</li>
<li>Batch processing instead of one-at-a-time</li>
</ul>
<strong>Tools:</strong> Burrow, Kafka Lag Exporter (Prometheus), Confluent Control Center, Datadog Kafka integration.`
  },
  {
    id: "kafka-06",
    category: "kafka", tags: ["apple"],
    q: "What is backpressure and how do you handle it in event-driven systems?",
    a: `<strong>Backpressure</strong> occurs when a downstream system can't keep up with the rate of incoming messages.<br><br>
<strong>Symptoms:</strong> Growing consumer lag, increasing memory usage, timeouts, OOMKills, cascading failures.<br><br>
<strong>Handling strategies:</strong><ul>
<li><strong>Buffering</strong> — Kafka naturally buffers (messages retained on disk). Consumer processes at its own pace. This is Kafka's biggest advantage over synchronous systems.</li>
<li><strong>Rate limiting consumers</strong> — control <code>max.poll.records</code> and processing batch size</li>
<li><strong>Scaling consumers</strong> — add instances (up to partition count) to increase throughput</li>
<li><strong>Load shedding</strong> — drop low-priority messages when overloaded (e.g., skip analytics events, keep payment events)</li>
<li><strong>Circuit breaker on downstream</strong> — if DB is slow, stop pulling messages temporarily rather than failing each one</li>
</ul>
<strong>SQS approach:</strong> Visibility timeout + maxReceiveCount. Failed messages retry with backoff, eventually land in DLQ.<br><br>
<strong>Key insight:</strong> Async messaging (Kafka/SQS) inherently handles backpressure better than synchronous HTTP — the queue absorbs spikes.`
  },
  {
    id: "kafka-07",
    category: "kafka", tags: ["apple"],
    q: "How do you design a notification system at scale? Walk through the architecture.",
    a: `<strong>Requirements:</strong> Deliver personalized alerts to millions of users across web, mobile, email with high reliability and low latency.<br><br>
<strong>Architecture:</strong><ol>
<li><strong>Event producers</strong> — services publish events to Kafka (payment completed, price alert triggered, order shipped)</li>
<li><strong>Notification service</strong> — consumes events, evaluates rules (who gets notified, via which channel, at what frequency)</li>
<li><strong>Channel dispatchers</strong> — separate services per channel:<ul>
<li>Push (APNs/FCM) — mobile notifications</li>
<li>Email (SES/SendGrid)</li>
<li>SMS (Twilio/SNS)</li>
<li>In-app (WebSocket or polling)</li>
</ul></li>
<li><strong>Preference store</strong> — DynamoDB: user notification preferences, opt-outs, frequency caps</li>
<li><strong>Deduplication</strong> — idempotency key per notification to prevent double-sends</li>
</ol>
<strong>Reliability:</strong><ul>
<li>Kafka provides durability and replay if a dispatcher fails</li>
<li>DLQ for undeliverable messages</li>
<li>Separate queues per channel — email backlog doesn't block push</li>
</ul>
<strong>Scale:</strong> Partition by user ID — all notifications for a user processed in order. Add partitions and consumers for throughput.`
  },
  {
    id: "kafka-08",
    category: "kafka", tags: ["apple"],
    q: "What is Kafka Connect and when would you use it?",
    a: `<strong>Kafka Connect</strong> — a framework for streaming data between Kafka and external systems without writing code.<br><br>
<strong>Source connectors</strong> — pull data INTO Kafka:<ul>
<li>Database CDC (Debezium) — stream every row change from PostgreSQL/MySQL to Kafka</li>
<li>S3 source — read files from S3 into Kafka topics</li>
<li>JDBC source — poll database tables for changes</li>
</ul>
<strong>Sink connectors</strong> — push data OUT of Kafka:<ul>
<li>Elasticsearch sink — index events for search</li>
<li>S3 sink — archive events to data lake</li>
<li>JDBC sink — write events to a database</li>
</ul>
<strong>Why use it:</strong><ul>
<li>No custom consumer/producer code to maintain</li>
<li>Handles offset management, retries, parallelism, exactly-once</li>
<li>Huge ecosystem of pre-built connectors</li>
</ul>
<strong>Debezium + Outbox pattern:</strong> Application writes to outbox table → Debezium CDC captures the change → publishes to Kafka. This is the gold standard for reliable event publishing without dual-write problems.`
  },
  {
    id: "kafka-09",
    category: "kafka", tags: ["apple"],
    q: "How do you handle schema evolution in Kafka?",
    a: `<strong>Problem:</strong> Producers and consumers evolve independently. A schema change can break consumers.<br><br>
<strong>Schema Registry</strong> (Confluent or AWS Glue):<ul>
<li>Central store for Avro/Protobuf/JSON schemas</li>
<li>Each message includes a <strong>schema ID</strong> in its header</li>
<li>Consumer fetches schema from registry to deserialize</li>
</ul>
<strong>Compatibility modes:</strong><ul>
<li><strong>BACKWARD</strong> — new schema can read old data (add optional fields, remove fields with defaults). Consumer-first deploy.</li>
<li><strong>FORWARD</strong> — old schema can read new data. Producer-first deploy.</li>
<li><strong>FULL</strong> — both directions. Safest but most restrictive.</li>
</ul>
<strong>Best practices:</strong><ul>
<li>Use <strong>Avro or Protobuf</strong> — schema-enforced, compact binary</li>
<li>Never remove required fields or change field types</li>
<li>Add new fields with <strong>defaults</strong></li>
<li>Use <strong>BACKWARD compatibility</strong> as default — deploy consumers first, then producers</li>
<li>Register schemas in CI — fail the build if compatibility check fails</li>
</ul>`
  },
  {
    id: "kafka-10",
    category: "kafka", tags: ["apple"],
    q: "What is the difference between at-most-once, at-least-once, and exactly-once delivery?",
    a: `<strong>At-most-once:</strong><ul>
<li>Message delivered <strong>zero or one time</strong>. May be lost.</li>
<li>Producer sends and forgets (<code>acks=0</code>). Consumer commits offset before processing.</li>
<li>Use when: losing messages is acceptable (metrics sampling, logging)</li>
</ul>
<strong>At-least-once:</strong><ul>
<li>Message delivered <strong>one or more times</strong>. Never lost, may be duplicated.</li>
<li>Producer retries on failure (<code>acks=all</code>). Consumer commits offset after processing.</li>
<li>Use when: duplicates are tolerable or consumer is idempotent</li>
</ul>
<strong>Exactly-once:</strong><ul>
<li>Message delivered <strong>exactly one time</strong>. Never lost, never duplicated.</li>
<li>Requires: idempotent producer + transactional read-process-write + <code>read_committed</code> consumers</li>
<li>Use when: financial transactions, payment processing, inventory updates</li>
</ul>
<strong>Practical reality:</strong> True exactly-once is achieved through <strong>at-least-once + idempotent processing</strong>. Make your consumer idempotent (check if already processed using a unique ID) and you get effectively exactly-once.`
  },

  // ── Caching & Redis ─────────────────────────────────────────────
  {
    id: "cache-01",
    category: "cache", tags: ["apple"],
    q: "What are the common caching strategies? Compare cache-aside, write-through, and write-behind.",
    a: `<strong>Cache-Aside (Lazy Loading):</strong><ol>
<li>App checks cache first</li>
<li>Cache miss → read from DB → write to cache → return</li>
<li>Cache hit → return directly</li>
</ol>
Most common pattern. App controls cache population. Risk of stale data if DB is updated without invalidating cache.<br><br>
<strong>Write-Through:</strong><ol>
<li>App writes to cache AND DB simultaneously</li>
<li>Cache is always consistent with DB</li>
</ol>
Higher write latency (two writes per operation). Cache is always fresh.<br><br>
<strong>Write-Behind (Write-Back):</strong><ol>
<li>App writes to cache only</li>
<li>Cache asynchronously flushes to DB in batches</li>
</ol>
Lowest write latency. Risk of data loss if cache crashes before flush.<br><br>
<strong>For payments:</strong> Cache-aside for read-heavy lookups (user profiles, exchange rates). Never cache-aside for financial balances — always read from DB (source of truth).`
  },
  {
    id: "cache-02",
    category: "cache", tags: ["apple"],
    q: "What is Redis and what data structures does it offer?",
    a: `<strong>Redis</strong> — in-memory data structure store used as cache, message broker, and database. <strong>Sub-millisecond latency.</strong><br><br>
<strong>Core data structures:</strong><ul>
<li><strong>String</strong> — simple key-value. Counters (<code>INCR</code>), session tokens, cached JSON.</li>
<li><strong>Hash</strong> — field-value map under a key. User profiles, object attributes.</li>
<li><strong>List</strong> — ordered collection. Job queues, activity feeds.</li>
<li><strong>Set</strong> — unique unordered collection. Tags, unique visitors.</li>
<li><strong>Sorted Set</strong> — set with scores. Leaderboards, rate limiting (sliding window), priority queues.</li>
<li><strong>Stream</strong> — append-only log (like Kafka lite). Event sourcing, message queues with consumer groups.</li>
</ul>
<strong>Key features:</strong><ul>
<li><strong>TTL</strong> — automatic expiration per key</li>
<li><strong>Pub/Sub</strong> — real-time messaging (but no persistence)</li>
<li><strong>Lua scripting</strong> — atomic multi-step operations</li>
<li><strong>Transactions</strong> — MULTI/EXEC for atomic command batches</li>
</ul>
<strong>AWS:</strong> ElastiCache (managed Redis) or MemoryDB (durable Redis with persistence).`
  },
  {
    id: "cache-03",
    category: "cache", tags: ["apple"],
    q: "How do you handle cache invalidation? Why is it considered hard?",
    a: `<em>"There are only two hard things in computer science: cache invalidation and naming things."</em><br><br>
<strong>Why it's hard:</strong> The cache and DB can get out of sync. Stale data causes bugs that are hard to reproduce and debug.<br><br>
<strong>Invalidation strategies:</strong><ul>
<li><strong>TTL-based</strong> — set expiration time. Simple but data can be stale until TTL expires. Good for: exchange rates, feature flags.</li>
<li><strong>Event-driven</strong> — invalidate/update cache when DB changes (via CDC, Kafka events, or application code). More complex but more consistent.</li>
<li><strong>Write-through</strong> — update cache on every write. Always consistent but higher write cost.</li>
</ul>
<strong>Common pitfalls:</strong><ul>
<li><strong>Race condition:</strong> Thread A reads DB → Thread B updates DB + invalidates cache → Thread A writes stale data to cache</li>
<li><strong>Fix:</strong> Delete cache entry (don't update it). Next read will fetch fresh data.</li>
<li><strong>Thundering herd:</strong> Popular key expires → 1000 requests all miss cache → all hit DB simultaneously</li>
<li><strong>Fix:</strong> Mutex/lock so only one request repopulates. Or use stale-while-revalidate.</li>
</ul>`
  },
  {
    id: "cache-04",
    category: "cache", tags: ["apple"],
    q: "How does Redis handle high availability and persistence?",
    a: `<strong>Persistence modes:</strong><ul>
<li><strong>RDB (snapshots)</strong> — periodic point-in-time snapshots to disk. Fast recovery but you lose data since last snapshot.</li>
<li><strong>AOF (Append Only File)</strong> — logs every write command. More durable (configurable: every second or every write). Slower recovery (replay log).</li>
<li><strong>RDB + AOF</strong> — best of both. Use AOF for durability, RDB for fast restarts.</li>
</ul>
<strong>High availability:</strong><ul>
<li><strong>Redis Sentinel</strong> — monitors primary, auto-failover to replica if primary dies. Good for single-shard HA.</li>
<li><strong>Redis Cluster</strong> — data sharded across multiple nodes (16384 hash slots). Horizontal scaling + HA. Each shard has primary + replicas.</li>
</ul>
<strong>AWS ElastiCache:</strong><ul>
<li>Cluster mode disabled — single shard, up to 5 read replicas, multi-AZ failover</li>
<li>Cluster mode enabled — multiple shards, auto-scaling, up to 500 nodes</li>
</ul>
<strong>For payments:</strong> Use Redis Cluster or ElastiCache cluster mode for idempotency key lookups, session caching, and rate limiting. AOF enabled for durability.`
  },
  {
    id: "cache-05",
    category: "cache", tags: ["apple"],
    q: "How do you use Redis for rate limiting?",
    a: `<strong>Sliding window with Sorted Sets:</strong><ol>
<li>Key = <code>ratelimit:{user_id}</code></li>
<li>On each request: <code>ZADD key timestamp timestamp</code></li>
<li><code>ZREMRANGEBYSCORE key 0 (now - window_size)</code> — remove expired entries</li>
<li><code>ZCARD key</code> — count requests in window</li>
<li>If count > limit → reject (429)</li>
</ol>
All in one Lua script for atomicity.<br><br>
<strong>Token bucket with simple keys:</strong><ol>
<li>Key = <code>tokens:{user_id}</code>, value = remaining tokens</li>
<li><code>DECR</code> on each request. Reject if ≤ 0.</li>
<li>Separate process or TTL refills tokens periodically.</li>
</ol>
<strong>Fixed window (simplest):</strong><ul>
<li><code>INCR ratelimit:{user_id}:{minute}</code> with <code>EXPIRE 60</code></li>
<li>If count > limit → reject</li>
<li>Edge case: 100 requests at :59 + 100 at :00 = 200 in 2 seconds</li>
</ul>
<strong>At Apple scale:</strong> Use ElastiCache Redis Cluster. Per-user + per-endpoint limits. Return <code>X-RateLimit-Remaining</code> and <code>Retry-After</code> headers.`
  },
  {
    id: "cache-06",
    category: "cache", tags: ["apple"],
    q: "What is the thundering herd problem and how do you solve it?",
    a: `<strong>Problem:</strong> A popular cache key expires. Hundreds of concurrent requests all miss the cache simultaneously and hit the database, potentially overwhelming it.<br><br>
<strong>Solutions:</strong><ul>
<li><strong>Mutex/lock</strong> — first request acquires a distributed lock (Redis <code>SET NX EX</code>), fetches from DB, populates cache, releases lock. Other requests wait or get stale data.</li>
<li><strong>Stale-while-revalidate</strong> — serve stale cached data while one background request refreshes the cache. Users get fast (slightly stale) responses.</li>
<li><strong>Proactive refresh</strong> — refresh cache <em>before</em> TTL expires using a background job or a "soft TTL" that triggers async refresh while still serving cached data.</li>
<li><strong>Jittered TTLs</strong> — add randomness to TTL (<code>TTL = base + random(0, 60s)</code>) so keys don't all expire at the same time.</li>
<li><strong>Request coalescing</strong> — at the application layer, deduplicate concurrent requests for the same key. Only one DB query, all waiters get the result.</li>
</ul>
<strong>Best practice:</strong> Combine jittered TTLs (prevention) + mutex (handling). For hot keys, use proactive refresh to ensure they never actually expire.`
  },
  {
    id: "cache-07",
    category: "cache", tags: ["apple"],
    q: "When should you NOT use a cache?",
    a: `<strong>Don't cache when:</strong><ul>
<li><strong>Data changes on every read</strong> — cache hit rate ≈ 0%, overhead without benefit</li>
<li><strong>Consistency is critical</strong> — financial balances, inventory counts. Stale data = incorrect charges or overselling.</li>
<li><strong>Data is already fast to fetch</strong> — if DB query takes 2ms, adding a cache adds complexity for minimal gain</li>
<li><strong>Cache adds more complexity than value</strong> — invalidation bugs, operational overhead of running Redis</li>
<li><strong>Write-heavy workloads</strong> — if data changes more often than it's read, cache is constantly invalidated</li>
</ul>
<strong>Do cache when:</strong><ul>
<li><strong>Read-heavy, write-light</strong> — user profiles, product catalog, exchange rates</li>
<li><strong>Expensive to compute</strong> — aggregation results, ML predictions</li>
<li><strong>High traffic on the same data</strong> — homepage content, popular products</li>
<li><strong>Tolerance for staleness</strong> — a few seconds of stale data is acceptable</li>
</ul>
<strong>For payments:</strong> Cache user preferences, merchant configs, exchange rates. Do NOT cache account balances or transaction state.`
  },
  {
    id: "cache-08",
    category: "cache", tags: ["apple"],
    q: "Compare ElastiCache Redis vs DynamoDB DAX vs CloudFront. When do you use each?",
    a: `<strong>ElastiCache Redis:</strong><ul>
<li>General-purpose caching for any data source</li>
<li>Rich data structures (sorted sets, hashes, pub/sub)</li>
<li>Use for: session stores, rate limiting, leaderboards, real-time counters</li>
</ul>
<strong>DynamoDB DAX:</strong><ul>
<li>In-memory cache <strong>specifically for DynamoDB</strong></li>
<li>Drop-in replacement — same DynamoDB API, no code changes</li>
<li>Microsecond read latency for cached items</li>
<li>Use for: DynamoDB read-heavy workloads. Item cache + query cache.</li>
</ul>
<strong>CloudFront (CDN):</strong><ul>
<li>Edge caching for HTTP responses</li>
<li>Caches API responses, static assets, at 400+ edge locations globally</li>
<li>Use for: public API responses, static content, reducing origin load</li>
</ul>
<strong>Layered approach at scale:</strong><br>
CloudFront (edge, public APIs) → ElastiCache Redis (app-level, session/rate-limit) → DAX (DynamoDB reads) → Database<br><br>
Each layer reduces load on the next. For payments: CloudFront for public merchant APIs, Redis for idempotency keys and rate limiting, DAX for user preference lookups.`
  },

  // ── Event-Driven Architecture ───────────────────────────────────
  {
    id: "eda-01",
    category: "eda", tags: ["apple"],
    q: "What is event-driven architecture? Compare events, commands, and queries.",
    a: `<strong>Event-driven architecture (EDA)</strong> — services communicate through asynchronous events instead of synchronous requests.<br><br>
<strong>Event</strong> — something that <strong>happened</strong> (past tense, immutable fact):<br>
<code>PaymentCompleted { orderId, amount, timestamp }</code><br>
Producer doesn't know or care who consumes it. Loose coupling.<br><br>
<strong>Command</strong> — a <strong>request to do something</strong> (directed at a specific service):<br>
<code>ProcessPayment { orderId, amount }</code><br>
Sender expects the receiver to act. Tighter coupling.<br><br>
<strong>Query</strong> — a <strong>request for data</strong> (no side effects):<br>
<code>GetPaymentStatus { paymentId }</code><br><br>
<strong>Key EDA benefits:</strong><ul>
<li><strong>Loose coupling</strong> — services don't know about each other</li>
<li><strong>Scalability</strong> — consumers scale independently</li>
<li><strong>Resilience</strong> — if a consumer is down, events are buffered</li>
<li><strong>Auditability</strong> — event log is a natural audit trail</li>
</ul>
<strong>Tradeoff:</strong> Harder to debug (distributed, async), eventual consistency, event ordering complexity.`
  },
  {
    id: "eda-02",
    category: "eda", tags: ["apple"],
    q: "What is CQRS? When would you use it?",
    a: `<strong>CQRS (Command Query Responsibility Segregation)</strong> — use different models for reading and writing data.<br><br>
<strong>Write side (Command):</strong><ul>
<li>Optimized for <strong>business logic and validation</strong></li>
<li>Normalized data model (e.g., relational DB)</li>
<li>Publishes events when state changes</li>
</ul>
<strong>Read side (Query):</strong><ul>
<li>Optimized for <strong>query patterns</strong></li>
<li>Denormalized projections (e.g., materialized views in DynamoDB, Elasticsearch)</li>
<li>Updated asynchronously by consuming events from write side</li>
</ul>
<strong>When to use:</strong><ul>
<li>Read and write patterns are <strong>very different</strong> (complex writes, simple reads — or vice versa)</li>
<li>Need to <strong>scale reads and writes independently</strong></li>
<li>Combined with <strong>event sourcing</strong> — events are the write model, projections are the read model</li>
</ul>
<strong>When NOT to use:</strong> Simple CRUD apps. The added complexity isn't worth it for straightforward read/write patterns.<br><br>
<strong>Payments example:</strong> Write model processes payments (complex validation, state machine). Read model serves transaction history (denormalized, fast queries).`
  },
  {
    id: "eda-03",
    category: "eda", tags: ["apple"],
    q: "What is the difference between pub/sub and point-to-point messaging?",
    a: `<strong>Point-to-Point (Queue):</strong><ul>
<li>One message → <strong>one consumer</strong></li>
<li>Message is removed after processing</li>
<li>Used for: task distribution, work queues, job processing</li>
<li>Example: SQS, RabbitMQ queue</li>
</ul>
<strong>Pub/Sub (Topic):</strong><ul>
<li>One message → <strong>all subscribers</strong></li>
<li>Each subscriber gets its own copy</li>
<li>Used for: event broadcasting, notifications, data replication</li>
<li>Example: SNS, Kafka consumer groups, Redis Pub/Sub</li>
</ul>
<strong>Kafka is both:</strong><ul>
<li><strong>Point-to-point</strong> within a consumer group (each partition → one consumer)</li>
<li><strong>Pub/sub</strong> across consumer groups (each group gets all messages independently)</li>
</ul>
<strong>Pattern for payments:</strong><br>
<code>PaymentCompleted</code> event published to Kafka topic. Multiple consumer groups subscribe independently: notification service sends receipt, analytics service tracks revenue, loyalty service awards points. Each processes at its own pace.`
  },
  {
    id: "eda-04",
    category: "eda", tags: ["apple"],
    q: "How do you handle event ordering across microservices?",
    a: `<strong>The problem:</strong> Events for the same entity can arrive out of order, especially across partitions or services.<br><br>
<strong>Strategies:</strong><br><br>
<strong>1. Partition by entity ID:</strong><ul>
<li>All events for user-123 go to the same Kafka partition</li>
<li>Guarantees ordering for that entity. Simplest approach.</li>
</ul>
<strong>2. Event versioning:</strong><ul>
<li>Include a <strong>sequence number or version</strong> in each event</li>
<li>Consumer rejects/requeues events that arrive out of order</li>
<li><code>if event.version != currentVersion + 1 → requeue</code></li>
</ul>
<strong>3. Timestamp-based reconciliation:</strong><ul>
<li>Use <strong>last-write-wins</strong> with timestamps</li>
<li>Only apply event if its timestamp > current state timestamp</li>
<li>Simple but can lose updates in rare clock-skew scenarios</li>
</ul>
<strong>4. Causal ordering:</strong><ul>
<li>Track dependencies: event B depends on event A</li>
<li>Buffer event B until event A is processed</li>
<li>Most correct, most complex</li>
</ul>
<strong>Practical advice:</strong> Partition by entity key covers 90% of cases. Only add complexity when you've proven you need it.`
  },
  {
    id: "eda-05",
    category: "eda", tags: ["apple"],
    q: "What is event schema evolution and how do you manage it?",
    a: `<strong>Problem:</strong> As your system evolves, event schemas change. Old events in Kafka are still there. New consumers need to read old events. Old consumers need to handle new events.<br><br>
<strong>Rules for safe evolution:</strong><ul>
<li><strong>Add fields</strong> — always safe if optional with defaults</li>
<li><strong>Remove fields</strong> — safe if consumers handle missing fields</li>
<li><strong>Rename fields</strong> — BREAKING. Add new field, deprecate old one.</li>
<li><strong>Change field types</strong> — BREAKING. Never do this.</li>
</ul>
<strong>Schema Registry:</strong><ul>
<li>Central authority for event schemas (Confluent, AWS Glue)</li>
<li>Enforces compatibility checks on every schema change</li>
<li>Producers register schema → get schema ID → embed in message</li>
<li>Consumers fetch schema by ID → deserialize correctly</li>
</ul>
<strong>Versioned events pattern:</strong><ul>
<li>Include <code>eventType</code> and <code>version</code> in every event</li>
<li>Consumers switch on version: <code>PaymentCompleted.v1</code> vs <code>PaymentCompleted.v2</code></li>
<li>Write adapters to transform old versions to new</li>
</ul>
<strong>Use Avro or Protobuf</strong> — both support schema evolution natively. Avoid plain JSON (no schema enforcement, no compatibility checks).`
  },
  {
    id: "eda-06",
    category: "eda", tags: ["apple"],
    q: "What is the Strangler Fig pattern for migrating to event-driven?",
    a: `<strong>Problem:</strong> You have a monolith making synchronous calls. You want to move to event-driven microservices. You can't rewrite everything at once.<br><br>
<strong>Strangler Fig pattern:</strong> Gradually replace pieces of the monolith by intercepting and redirecting functionality, like a strangler fig tree growing around a host tree.<br><br>
<strong>Steps:</strong><ol>
<li><strong>Intercept</strong> — put an API gateway or event router in front of the monolith</li>
<li><strong>Extract</strong> — build a new microservice for one bounded context (e.g., notifications)</li>
<li><strong>Redirect</strong> — route that traffic/events to the new service. Monolith still handles everything else.</li>
<li><strong>Repeat</strong> — extract the next bounded context</li>
<li><strong>Retire</strong> — once all functionality is extracted, decommission the monolith</li>
</ol>
<strong>Event-driven migration variant:</strong><ul>
<li>Monolith starts <strong>publishing events</strong> for key state changes</li>
<li>New microservices <strong>consume events</strong> instead of calling monolith APIs</li>
<li>Dual-write period: monolith handles requests AND publishes events</li>
<li>Eventually, new services own the domain and monolith is removed</li>
</ul>
<strong>Key:</strong> Both old and new systems run simultaneously. No big-bang cutover. Rollback is always possible.`
  },
  {
    id: "eda-07",
    category: "eda", tags: ["apple"],
    q: "How do you test event-driven systems?",
    a: `Event-driven systems are harder to test because they're async and distributed.<br><br>
<strong>Unit tests:</strong><ul>
<li>Test event handlers in isolation — given event X, assert state Y</li>
<li>Mock the message broker. Focus on business logic.</li>
</ul>
<strong>Integration tests:</strong><ul>
<li>Use <strong>embedded Kafka</strong> (Testcontainers) or <strong>LocalStack</strong> for SQS/SNS</li>
<li>Produce event → assert consumer processes correctly → verify DB state</li>
<li>Test schema serialization/deserialization round-trip</li>
</ul>
<strong>Contract tests:</strong><ul>
<li>Verify producer events match consumer expectations</li>
<li>Tools: Pact, Schema Registry compatibility checks in CI</li>
<li>Catch breaking schema changes before deploy</li>
</ul>
<strong>End-to-end tests:</strong><ul>
<li>Publish event → wait for downstream effect (notification sent, record created)</li>
<li>Use <strong>polling with timeout</strong> — assert eventual state within N seconds</li>
<li>Avoid: flaky timing-dependent assertions</li>
</ul>
<strong>Chaos testing:</strong><ul>
<li>Kill a consumer mid-processing — does it recover and reprocess?</li>
<li>Inject duplicate events — does the consumer handle them idempotently?</li>
<li>Simulate network partition between producer and broker</li>
</ul>`
  },
  {
    id: "eda-08",
    category: "eda", tags: ["apple"],
    q: "What is Change Data Capture (CDC) and how does Debezium work?",
    a: `<strong>CDC</strong> captures row-level changes (INSERT, UPDATE, DELETE) from a database and streams them as events.<br><br>
<strong>Why CDC over application events:</strong><ul>
<li>No dual-write problem — changes captured directly from the DB transaction log</li>
<li>Captures ALL changes (including direct DB updates, migrations, scripts)</li>
<li>Zero application code changes needed</li>
</ul>
<strong>Debezium</strong> — open-source CDC platform, runs as Kafka Connect connectors:<ol>
<li>Reads the database's <strong>transaction log</strong> (PostgreSQL WAL, MySQL binlog)</li>
<li>Converts each change to a <strong>structured event</strong> (before/after state)</li>
<li>Publishes to Kafka topic (one topic per table by default)</li>
</ol>
<strong>Event structure:</strong><pre><code>{
  "op": "u",  // c=create, u=update, d=delete
  "before": { "id": 1, "status": "pending" },
  "after":  { "id": 1, "status": "completed" },
  "source": { "table": "payments", "lsn": "..." }
}</code></pre>
<strong>Use cases:</strong> Cache invalidation, search index sync, data replication, audit logs, microservice data sync, powering the transactional outbox pattern.`
  }
];
