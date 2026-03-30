var MOCK_QUESTIONS = [
  // ── Round 1: K8s & CRD Design ──────────────────────────────────
  {
    id: 1,
    round: "k8s-crd",
    question: "Walk me through the Kubernetes control plane. What happens when you create a Deployment?",
    strongAnswer: "The control plane has four main components. The <strong>API Server</strong> is the front door \u2014 every request goes through it. <strong>etcd</strong> is the distributed key-value store that holds all cluster state. The <strong>Scheduler</strong> assigns pods to nodes. The <strong>Controller Manager</strong> runs reconciliation loops.<br><br>When I <code>kubectl apply</code> a Deployment: kubectl sends the manifest to the API Server. It authenticates me, checks RBAC authorization, runs admission webhooks, validates the spec, and persists to etcd. The Deployment controller sees the new Deployment and creates a ReplicaSet. The ReplicaSet controller creates Pod objects. The Scheduler evaluates node fitness and assigns each pod to a node. The kubelet on each assigned node pulls the container image and starts the containers.<br><br>Every step is driven by the reconciliation pattern \u2014 controllers watching for state changes and acting to converge actual state toward desired state."
  },
  {
    id: 2,
    round: "k8s-crd",
    question: "Design a CRD that lets developers deploy services to your platform.",
    strongAnswer: "I'd create an <code>Application</code> CRD in a group like <code>platform.playstation.com/v1</code>. The spec would include: <code>repository</code> (git URL), <code>runtime</code> (language/version), <code>scaling</code> (min/max replicas, target CPU), and <code>networking</code> (ports, ingress hostname).<br><br>The key design principle is <strong>spec vs status separation</strong>. Users only write spec \u2014 what they want. The controller writes status \u2014 what's actually happening. I'd include a <code>conditions</code> array in status following the standard pattern.<br><br>The controller would reconcile this into multiple Kubernetes resources: a Deployment, a Service, an HPA, a ServiceMonitor, and NetworkPolicies. I'd use owner references so all child resources are garbage collected when the Application is deleted.<br><br>For validation, I'd combine OpenAPI schema for static validation with a validating admission webhook for complex business rules (e.g., production apps must have at least 2 replicas)."
  },
  {
    id: 3,
    round: "k8s-crd",
    question: "How do you handle CRD versioning when you need to make breaking changes?",
    strongAnswer: "I'd follow the Kubernetes API versioning pattern. Start with <code>v1alpha1</code> for experimental APIs, graduate to <code>v1beta1</code> when stable, and <code>v1</code> for production.<br><br>For breaking changes: introduce the new version alongside the old one. Both versions are served by the API server simultaneously. Write a <strong>conversion webhook</strong> that translates between versions \u2014 this is key. Mark the new version as the storage version. Existing resources are stored in the new format, but clients using the old version still work because the webhook converts on the fly.<br><br>Then deprecate the old version with a timeline, provide migration tooling, and eventually stop serving it. The key principle is: <strong>never break existing users</strong>. Always provide a migration path."
  },
  {
    id: 4,
    round: "k8s-crd",
    question: "Your operator creates Deployments as child resources. The Deployment gets modified by another controller. How do you handle this?",
    strongAnswer: "This is the challenge of shared ownership. My approach: the operator should only manage the fields it cares about and use <strong>server-side apply</strong> with field managers. This way, my operator owns specific fields (like replicas, image) while another controller can own other fields (like annotations from a monitoring tool).<br><br>If I detect drift on fields I own (someone manually edited replicas), my reconciliation loop will revert it to the desired state from the CRD spec \u2014 that's the point of declarative management. But I should log a warning so the team knows their manual change was reverted.<br><br>I'd also set owner references so my child resources are garbage collected when the parent CRD is deleted. And I'd use resource versions for optimistic concurrency \u2014 if my update conflicts, I refetch and retry."
  },
  {
    id: 5,
    round: "k8s-crd",
    question: "Explain the difference between level-triggered and edge-triggered reconciliation. Why does Kubernetes prefer level-triggered?",
    strongAnswer: "Edge-triggered means reacting to events \u2014 \"a pod was created, do something.\" Level-triggered means reacting to state \u2014 \"there should be 3 pods, there are 2, create one.\"<br><br>Kubernetes prefers level-triggered because it's more resilient. If an edge event is missed (controller was restarting, network blip), the system gets stuck. With level-triggered, the controller always compares desired vs actual state on each reconciliation \u2014 even if it missed events, it will catch up when it runs next. This makes controllers <strong>self-healing</strong> and <strong>idempotent</strong>. You can restart a controller at any time and it will converge to the right state."
  },

  // ── Round 2: Systems Design & Platform ──────────────────────────
  {
    id: 6,
    round: "systems",
    question: "Design a CI/CD platform for a large engineering organization.",
    strongAnswer: "<em>(Start by asking clarifying questions)</em>: How many engineers and services? Multi-region? What languages/frameworks? Existing tools?<br><br><strong>High-level architecture:</strong> GitOps approach. Source of truth is Git. Argo CD watches repositories and syncs to Kubernetes clusters.<br><br><strong>Components:</strong><ul><li><strong>Pipeline CRD</strong>: Developers define their build/test/deploy pipeline declaratively</li><li><strong>Event Router</strong>: GitHub webhooks trigger pipeline runs</li><li><strong>Build System</strong>: Ephemeral build pods (Tekton or Kaniko) \u2014 scales to zero when idle</li><li><strong>Artifact Registry</strong>: Internal container registry</li><li><strong>Deployment</strong>: Argo CD for GitOps sync to multiple environments</li><li><strong>Promotion</strong>: dev \u2192 staging (auto) \u2192 prod (approval gate)</li></ul><strong>Key decisions:</strong> Pull-based (GitOps) over push-based for auditability and self-healing. Ephemeral build environments for isolation and security. Pipeline-as-code \u2014 pipelines live in the service's repo."
  },
  {
    id: 7,
    round: "systems",
    question: "How would you design a multi-tenant platform for 200 teams?",
    strongAnswer: "Namespace-based isolation with strong guardrails \u2014 the right balance of isolation, cost, and complexity.<br><br><strong>Per-tenant setup:</strong><ul><li>Dedicated namespace with ResourceQuotas (CPU, memory, pod count limits)</li><li>LimitRanges for per-pod defaults and maximums</li><li>NetworkPolicies (default deny, allow only necessary traffic)</li><li>RBAC (team members get namespace-scoped edit Role)</li><li>ServiceAccount per workload</li></ul><strong>Automation:</strong> A <code>Tenant</code> CRD that a controller reconciles into all of the above. Onboarding a team = creating one YAML file, not filing 10 tickets.<br><br><strong>When to escalate isolation:</strong> If a team has strict compliance requirements (PCI, HIPAA) or needs kernel-level isolation, consider vCluster or dedicated clusters. But start with namespaces \u2014 they handle 90% of cases."
  },
  {
    id: 8,
    round: "systems",
    question: "One of your platform's core services has a cascading failure affecting multiple teams. Walk me through your response.",
    strongAnswer: "<strong>Immediate (first 5 minutes):</strong><ul><li>Check dashboards \u2014 what's the blast radius? Which services are affected?</li><li>Check recent deployments \u2014 was anything deployed in the last hour?</li><li>If a recent deploy, roll back immediately. GitOps makes this trivial \u2014 revert the commit.</li></ul><strong>Diagnose (next 15 minutes):</strong><ul><li>Traces: Follow failing requests \u2014 where in the chain is the failure?</li><li>Metrics: Resource usage, error rates, latency by service</li><li>Logs: Filter by trace IDs of failing requests</li></ul><strong>Mitigate:</strong> Circuit breaking should already be limiting blast radius. If a dependency is the problem, implement a fallback or shed load. Scale up healthy services if overloaded from retries.<br><br><strong>Prevent recurrence:</strong> Postmortem within 48 hours. Blameless, focused on systemic improvements. Did our circuit breakers fire? Did our alerts catch it fast enough?"
  },
  {
    id: 9,
    round: "systems",
    question: "How would you introduce Istio service mesh to a platform with 500 existing services?",
    strongAnswer: "<strong>Never big-bang. Phased rollout:</strong><br><br><strong>Phase 1 (weeks 1-2):</strong> Install Istio control plane. Enable sidecar injection on ONE low-risk namespace. Validate: latency impact? Breaking changes?<br><br><strong>Phase 2 (weeks 3-8):</strong> Roll out namespace by namespace, starting with willing \"lighthouse\" teams. Provide opt-out annotations. First win: free observability \u2014 teams get traffic metrics and tracing without code changes.<br><br><strong>Phase 3 (months 2-3):</strong> Enable mTLS in PERMISSIVE mode. Validate all services can communicate. Then migrate to STRICT namespace by namespace.<br><br><strong>Phase 4 (ongoing):</strong> Enable advanced features \u2014 canary deployments, circuit breaking, authorization policies \u2014 team by team as they're ready.<br><br><strong>Key principles:</strong> Gradual rollout, always have an escape hatch, start with non-breaking wins (observability), communicate heavily with teams."
  },
  {
    id: 10,
    round: "systems",
    question: "Design a self-service experience for creating new services.",
    strongAnswer: "I'd build a template-based system accessible through both a CLI and web portal.<br><br><strong>Flow:</strong> Developer runs <code>psx create service --name my-service --template go-grpc</code> or clicks \"New Service\" in the portal. They provide: service name, team, template, and optionally customize settings.<br><br><strong>What happens behind the scenes:</strong> A <code>ServiceTemplate</code> CRD is created. The controller: generates a Git repository from the template (with Dockerfile, CI pipeline, K8s manifests, README), creates the CI/CD pipeline in Argo CD, provisions the namespace, sets up monitoring (ServiceMonitor, dashboard), registers in the service catalog, and creates RBAC for the team.<br><br><strong>Time to first deploy:</strong> Under 30 minutes. Developer creates the service, writes their code, pushes to main, and it's deployed to dev automatically.<br><br><strong>Templates include:</strong> Dockerfile, standard health check endpoints, Prometheus metrics endpoint, structured logging, Kubernetes manifests with sensible defaults, CI pipeline definition."
  },

  // ── Rapid-Fire ──────────────────────────────────────────────────
  {
    id: 11,
    round: "rapid-fire",
    question: "How does kube-proxy work?",
    strongAnswer: "kube-proxy runs on every node and maintains <strong>iptables or IPVS rules</strong> that route Service traffic to healthy backend pods. It watches the API server for Service and Endpoint changes and updates rules accordingly. In modern setups it uses IPVS for better performance at scale."
  },
  {
    id: 12,
    round: "rapid-fire",
    question: "What's a headless Service?",
    strongAnswer: "A Service with <code>clusterIP: None</code>. Instead of a virtual IP, DNS returns the individual pod IPs directly. Used with StatefulSets so clients can address specific pods (e.g., a specific database replica)."
  },
  {
    id: 13,
    round: "rapid-fire",
    question: "Explain Ingress vs Gateway API.",
    strongAnswer: "Ingress is the original L7 routing resource \u2014 simple but limited (HTTP only, single resource for all config). <strong>Gateway API</strong> is the next-gen replacement \u2014 supports TCP/UDP, has role separation (infra team manages Gateway, app teams manage Routes), and is more expressive. Gateway API is the direction the ecosystem is moving."
  },
  {
    id: 14,
    round: "rapid-fire",
    question: "What's the most important pod security setting?",
    strongAnswer: "<code>runAsNonRoot: true</code> with <code>allowPrivilegeEscalation: false</code>. Running as root inside a container is the most common and exploitable misconfiguration. Combined with dropping all capabilities and a read-only filesystem, you eliminate most container breakout vectors."
  },
  {
    id: 15,
    round: "rapid-fire",
    question: "How does RBAC work?",
    strongAnswer: "Four resources: <strong>Roles</strong> define permissions (verbs on resources) within a namespace. <strong>ClusterRoles</strong> define cluster-wide permissions. <strong>RoleBindings</strong> grant a Role to users/groups in a namespace. <strong>ClusterRoleBindings</strong> grant a ClusterRole cluster-wide. Best practice: use namespace-scoped Roles, bind to groups, and follow least privilege."
  },
  {
    id: 16,
    round: "rapid-fire",
    question: "What are the three pillars of observability?",
    strongAnswer: "<strong>Metrics</strong> (Prometheus \u2014 what's happening numerically), <strong>Logs</strong> (Loki/ELK \u2014 detailed event records), and <strong>Traces</strong> (Jaeger/Tempo \u2014 request flow across services). Metrics tell you something is wrong, traces tell you where, logs tell you why."
  },
  {
    id: 17,
    round: "rapid-fire",
    question: "What's the difference between monitoring and observability?",
    strongAnswer: "<strong>Monitoring</strong> tells you when known failure modes occur (predefined alerts). <strong>Observability</strong> lets you ask arbitrary questions about your system's behavior \u2014 even questions you didn't anticipate. It's the difference between \"alert me when error rate > 5%\" and \"why is this specific user's request slow on Tuesdays?\""
  },
  {
    id: 18,
    round: "rapid-fire",
    question: "What's the biggest mistake platform teams make?",
    strongAnswer: "Building a platform in isolation without continuous developer feedback. The platform becomes what the platform team <em>thinks</em> is useful, not what developers actually need. Treat it like a product \u2014 talk to your users, measure adoption, iterate based on feedback. Also: being too restrictive. If developers are working <em>around</em> your platform, that's a signal that your guardrails are gates."
  },
  {
    id: 19,
    round: "rapid-fire",
    question: "How do you convince teams to adopt the platform?",
    strongAnswer: "Make the paved road the <strong>easiest path, not the only path</strong>. If deploying through the platform takes 5 minutes and deploying without it takes 2 days, adoption happens naturally. Lead with value: \"You get monitoring, CI/CD, security, and autoscaling for free.\" Start with <strong>lighthouse teams</strong> who are excited, get them successful, and let their success stories drive adoption."
  }
];
