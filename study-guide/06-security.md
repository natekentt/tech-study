# Security

## Kubernetes Security Model

Security in Kubernetes spans multiple layers. Think of it as defense in depth:

```
┌─────────────────────────────────────┐
│  1. Cluster Security                │  (API server hardening, etcd encryption)
├─────────────────────────────────────┤
│  2. Authentication & Authorization  │  (Who are you? What can you do?)
├─────────────────────────────────────┤
│  3. Admission Control               │  (Is this request allowed by policy?)
├─────────────────────────────────────┤
│  4. Pod Security                    │  (What can the container do?)
├─────────────────────────────────────┤
│  5. Network Security                │  (Who can talk to whom?)
├─────────────────────────────────────┤
│  6. Runtime Security                │  (Is anything suspicious happening?)
├─────────────────────────────────────┤
│  7. Supply Chain Security           │  (Is the image trustworthy?)
└─────────────────────────────────────┘
```

## RBAC (Role-Based Access Control)

RBAC is how Kubernetes controls who can do what. Four key resources:

### Roles and ClusterRoles

```yaml
# Role — scoped to a namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: team-online
  name: developer
rules:
  - apiGroups: [""]              # Core API group
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "create", "update"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]       # Can read secrets but not create/delete
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]            # Can exec into pods (for debugging)
```

```yaml
# ClusterRole — cluster-wide
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: platform-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]                 # Full access (use sparingly!)
```

### Bindings

```yaml
# RoleBinding — grants Role to users/groups in a namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-online-developers
  namespace: team-online
subjects:
  - kind: Group
    name: team-online-devs       # From identity provider
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

```yaml
# ClusterRoleBinding — grants ClusterRole cluster-wide
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-admins
subjects:
  - kind: Group
    name: platform-engineering
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: platform-admin
  apiGroup: rbac.authorization.k8s.io
```

### RBAC Best Practices
- **Least privilege**: Give the minimum permissions needed
- **Use Groups, not individual users**: Easier to manage at scale
- **Namespace-scoped Roles** over ClusterRoles when possible
- **No wildcards in production**: `["*"]` resources/verbs is dangerous
- **Audit**: Regularly review who has what access
- **Service accounts**: Every workload gets its own SA with only the permissions it needs

## Service Accounts

Every pod runs as a service account. This is how pods authenticate to the Kubernetes API (and external services).

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: matchmaking-service
  namespace: team-online
  annotations:
    # AWS IAM role for cloud access (IRSA)
    eks.amazonaws.com/role-arn: "arn:aws:iam::123456:role/matchmaking-s3-reader"
```

```yaml
# Pod using the service account
apiVersion: v1
kind: Pod
metadata:
  name: matchmaking
spec:
  serviceAccountName: matchmaking-service   # Not the default SA
  automountServiceAccountToken: false       # Don't mount if not needed
```

**Key principle:** Don't use the `default` service account. Create one per workload with specific RBAC permissions.

## Pod Security

### Pod Security Standards (PSS) — replaced PodSecurityPolicies

Three levels:
- **Privileged**: No restrictions (only for system workloads)
- **Baseline**: Prevents known privilege escalations (good default)
- **Restricted**: Heavily restricted (best for untrusted workloads)

Applied via namespace labels:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-online
  labels:
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
```

### Security Context (per-pod/container settings)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true           # Don't run as root
    runAsUser: 1000              # Specific UID
    fsGroup: 2000                # File system group
    seccompProfile:
      type: RuntimeDefault       # Enable seccomp filtering
  containers:
    - name: app
      image: my-app:v1
      securityContext:
        allowPrivilegeEscalation: false  # Critical — prevents setuid
        readOnlyRootFilesystem: true     # Immutable container filesystem
        capabilities:
          drop: ["ALL"]          # Drop all Linux capabilities
          add: ["NET_BIND_SERVICE"]  # Add back only what's needed
      resources:                 # Always set resource limits
        requests:
          cpu: "250m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
```

### Key Pod Security Practices
1. **Run as non-root**: `runAsNonRoot: true` — most important setting
2. **Read-only filesystem**: Prevents attackers from writing malicious files
3. **Drop all capabilities**: Start with none, add back only what's needed
4. **No privilege escalation**: `allowPrivilegeEscalation: false`
5. **Resource limits**: Prevent resource abuse and noisy neighbors
6. **Don't mount service account token** unless needed

## Secrets Management

### Kubernetes Secrets (built-in)
- Base64-encoded, NOT encrypted by default
- Stored in etcd — if etcd is compromised, secrets are exposed
- Enable **encryption at rest** for etcd:
```yaml
# EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources: ["secrets"]
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-key>
      - identity: {}   # Fallback to plaintext for reading old secrets
```

### External Secrets (better approach for production)
- **External Secrets Operator**: Syncs secrets from external stores to K8s Secrets
- **Vault (HashiCorp)**: Full-featured secrets management with leasing, rotation, audit
- **Cloud provider secrets**: AWS Secrets Manager, GCP Secret Manager, Azure Key Vault
- **Sealed Secrets**: Encrypt secrets for safe storage in Git

```yaml
# External Secrets Operator example
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: matchmaking-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault
    kind: ClusterSecretStore
  target:
    name: matchmaking-secrets
  data:
    - secretKey: database-password
      remoteRef:
        key: secret/team-online/matchmaking
        property: db-password
```

## Supply Chain Security

### Image Security
- **Use specific image tags** (not `latest`) — better yet, use digests (`image@sha256:...`)
- **Scan images** for vulnerabilities (Trivy, Snyk, Grype)
- **Use minimal base images** (distroless, Alpine) — smaller attack surface
- **Sign images** (Cosign/Sigstore) — verify authenticity

### Admission Control for Security
```yaml
# OPA Gatekeeper or Kyverno policy
# Require images from approved registries only
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-registries
      match:
        resources:
          kinds: ["Pod"]
      validate:
        message: "Images must be from approved registries"
        pattern:
          spec:
            containers:
              - image: "registry.playstation.com/*"
```

## Network Security

Already covered in networking doc, but the security perspective:

- **NetworkPolicies**: Default deny, explicitly allow
- **mTLS via service mesh**: Encrypt all service-to-service traffic
- **API Gateway**: Authenticate and rate-limit external traffic
- **Separate sensitive workloads**: Databases in isolated namespaces with strict policies

## Interview Questions

**Q: How do you implement least privilege in Kubernetes?**
A: Multiple layers: (1) RBAC — create namespace-scoped Roles with only the verbs/resources needed, bind to groups not individuals. (2) Service accounts — one per workload, only mount tokens when needed. (3) Pod security — run as non-root, drop all capabilities, read-only filesystem. (4) Network policies — default deny, explicit allow. (5) Secrets — only mount what each workload needs, use external secrets management.

**Q: A developer needs access to debug a production pod. How do you handle this?**
A: Create a time-limited Role that grants `pods/exec` and `pods/log` in the specific namespace. Use a just-in-time access system (like Teleport or custom tooling) rather than standing access. Audit all exec sessions. Consider providing a debugging CRD that creates an ephemeral debug container (ephemeral containers feature) instead of exec-ing into the application container — this avoids giving shell access to the running process.

**Q: How do you manage secrets at scale?**
A: Use an external secrets manager (Vault, cloud provider secret stores) as the source of truth, synced to Kubernetes Secrets via External Secrets Operator. Never store secrets in Git (use Sealed Secrets if you must). Enable encryption at rest for etcd. Rotate secrets automatically. Audit secret access. Each workload gets only the secrets it needs via its service account.

**Q: What's your approach to securing a multi-tenant Kubernetes cluster?**
A: Layer the defenses: (1) Namespaces per tenant with ResourceQuotas and LimitRanges. (2) RBAC scoped to each tenant's namespace. (3) NetworkPolicies for network isolation between tenants. (4) Pod Security Standards (baseline minimum, restricted preferred). (5) Admission policies to enforce image registries, labels, and resource limits. (6) Separate sensitive shared services (databases, secrets) in isolated namespaces. (7) Audit logging enabled for all API server requests.

**Q: How do you prevent container breakout?**
A: Run as non-root, disable privilege escalation, drop all Linux capabilities, use read-only root filesystem, enable seccomp profiles (RuntimeDefault at minimum), use gVisor or Kata Containers for stronger isolation if needed, keep node OS and container runtime patched, scan images for known vulnerabilities, and use Pod Security Standards to enforce these at the namespace level.
