# API / CRD Design & Kubernetes Operators

## What is a CRD?

A **Custom Resource Definition** extends the Kubernetes API with your own resource types. Just like Kubernetes has built-in resources (Pods, Services, Deployments), you can create custom ones (GameServer, Pipeline, DatabaseCluster).

Once you define a CRD, users can `kubectl apply` your custom resources just like any built-in resource. The API server handles storage, validation, RBAC — you get it all for free.

```yaml
# Defining a CRD
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: gameservers.platform.playstation.com
spec:
  group: platform.playstation.com
  versions:
    - name: v1alpha1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required: ["game", "region"]
              properties:
                game:
                  type: string
                region:
                  type: string
                  enum: ["us-east", "us-west", "eu-west", "ap-northeast"]
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 100
                  default: 3
            status:
              type: object
              properties:
                readyReplicas:
                  type: integer
                phase:
                  type: string
      subresources:
        status: {}  # Enables /status subresource
      additionalPrinterColumns:
        - name: Game
          type: string
          jsonPath: .spec.game
        - name: Region
          type: string
          jsonPath: .spec.region
        - name: Ready
          type: integer
          jsonPath: .status.readyReplicas
  scope: Namespaced
  names:
    plural: gameservers
    singular: gameserver
    kind: GameServer
    shortNames: ["gs"]
```

```yaml
# Using the CRD — a developer creates this
apiVersion: platform.playstation.com/v1alpha1
kind: GameServer
metadata:
  name: horizon-forbidden-west
  namespace: studio-guerrilla
spec:
  game: horizon-forbidden-west
  region: us-west
  replicas: 5
```

## Spec vs Status Pattern

This is a **critical design pattern** in Kubernetes API design:

- **spec**: Desired state — what the USER wants. Only the user modifies this.
- **status**: Observed state — what the CONTROLLER reports. Only the controller modifies this.

This separation enables the reconciliation loop. The controller watches for spec changes, acts on them, and updates status to reflect reality.

```
User writes spec ──> Controller reads spec ──> Controller acts ──> Controller writes status
                          │                          │
                          └──── Reconcile Loop ──────┘
```

**Why the /status subresource matters:**
- Without it, a user updating spec could accidentally overwrite status (and vice versa)
- With it, spec and status are updated through separate API endpoints
- RBAC can be different: users can update spec, only controllers update status

## What is an Operator?

An Operator = CRD + Custom Controller. It's the pattern of encoding operational knowledge into software.

- **CRD**: Defines the API (what users can declare)
- **Controller**: Implements the behavior (what happens when they declare it)

### The Controller Reconciliation Loop

```go
// Pseudocode for a controller
func (r *GameServerReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. Fetch the custom resource
    gameServer := &v1alpha1.GameServer{}
    err := r.Get(ctx, req.NamespacedName, gameServer)
    if err != nil {
        if errors.IsNotFound(err) {
            return ctrl.Result{}, nil  // Resource deleted, nothing to do
        }
        return ctrl.Result{}, err  // Error fetching, requeue
    }

    // 2. Check actual state
    deployment := &appsv1.Deployment{}
    err = r.Get(ctx, types.NamespacedName{
        Name:      gameServer.Name,
        Namespace: gameServer.Namespace,
    }, deployment)

    if errors.IsNotFound(err) {
        // 3. Desired state doesn't exist yet — create it
        deployment = buildDeployment(gameServer)
        err = r.Create(ctx, deployment)
        return ctrl.Result{}, err
    }

    // 4. Compare desired vs actual
    if *deployment.Spec.Replicas != gameServer.Spec.Replicas {
        deployment.Spec.Replicas = &gameServer.Spec.Replicas
        err = r.Update(ctx, deployment)
        return ctrl.Result{}, err
    }

    // 5. Update status
    gameServer.Status.ReadyReplicas = deployment.Status.ReadyReplicas
    err = r.Status().Update(ctx, gameServer)

    return ctrl.Result{}, err
}
```

### Key Controller Principles
1. **Idempotent**: Running reconcile multiple times produces the same result
2. **Level-triggered, not edge-triggered**: Don't react to events — compare desired vs actual state each time
3. **Own your children**: The controller creates sub-resources (Deployments, Services) and sets owner references for garbage collection
4. **Requeue on failure**: If something fails, return an error and the controller will retry
5. **Single responsibility**: One controller manages one resource type

## API Design Best Practices

### Naming Conventions
- Group: `<team>.company.com` (e.g., `platform.playstation.com`)
- Resource names: lowercase, plural for the collection
- Use clear, domain-specific names (GameServer, not GenericResource)

### Versioning
- `v1alpha1` → experimental, may change without notice
- `v1beta1` → mostly stable, may have minor changes
- `v1` → stable, backward-compatible changes only
- Support multiple versions simultaneously during migration
- Use conversion webhooks to translate between versions

### Field Design
```yaml
spec:
  # Use specific, well-named fields
  replicas: 3                    # Not "count" or "num"
  region: "us-west"              # Enum for constrained choices
  resources:                     # Nest related fields
    cpu: "2"
    memory: "4Gi"
  scaling:                       # Group policy-related fields
    minReplicas: 1
    maxReplicas: 10
    targetCPUPercent: 70
```

### Validation
- Use OpenAPI v3 schema in the CRD for static validation (types, enums, ranges)
- Use validating admission webhooks for complex/dynamic validation
- Fail fast — validate at admission time, not reconciliation time

### Status Design
```yaml
status:
  phase: Running                 # High-level summary
  readyReplicas: 3
  conditions:                    # Standardized condition pattern
    - type: Available
      status: "True"
      lastTransitionTime: "2024-01-15T10:00:00Z"
      reason: MinimumReplicasAvailable
      message: "Deployment has minimum availability"
    - type: Progressing
      status: "True"
      lastTransitionTime: "2024-01-15T09:55:00Z"
      reason: NewReplicaSetAvailable
```

**Conditions pattern**: Standard way to report multiple aspects of status. Each condition has:
- `type`: What aspect (Available, Ready, Progressing, Degraded)
- `status`: True/False/Unknown
- `reason`: Machine-readable reason
- `message`: Human-readable detail
- `lastTransitionTime`: When the status last changed

## Admission Webhooks

Two types:
- **Mutating**: Modifies resources before they're persisted (inject defaults, add labels, inject sidecars)
- **Validating**: Accepts or rejects resources (enforce policies, check cross-resource constraints)

Processing order: Mutating → Validating → Persist to etcd

```
Request → Authentication → Authorization → Mutating Webhooks → Validating Webhooks → etcd
```

**PlayStation relevance:** A platform team would use mutating webhooks to inject standard labels, sidecar containers (service mesh), or resource defaults. Validating webhooks to enforce naming conventions, require certain annotations, or prevent dangerous configurations.

## Operator Frameworks

- **Kubebuilder**: The standard Go framework. Scaffolds CRDs, controllers, webhooks. Used by most production operators.
- **Operator SDK**: Red Hat's framework, builds on Kubebuilder. Adds Helm and Ansible operator types.
- **controller-runtime**: The underlying library both use. Provides the reconciler interface, caching client, leader election.

## Interview Questions

**Q: Design a CRD for an internal deployment pipeline.**
A: I'd design a `Pipeline` CRD in the `platform.playstation.com` group:
- **spec**: `repository` (git URL), `branch`, `stages` (list of build/test/deploy steps), `targetEnvironment`, `approvalRequired` (bool)
- **status**: `phase` (Pending/Running/Succeeded/Failed), `currentStage`, `startTime`, `completionTime`, `conditions` (array)
- The controller would watch Pipeline resources, create Tekton/Argo TaskRuns for each stage, update status as stages complete, gate on approvals if required

**Q: How do you handle CRD versioning and migration?**
A:
1. Introduce new version (v1beta1) alongside old (v1alpha1)
2. Write a conversion webhook to translate between versions
3. Mark the new version as the storage version
4. Migrate existing resources using `kubectl` or a migration job
5. Deprecate the old version, stop serving it
6. Key: never break existing users — always provide a migration path

**Q: What's the difference between a mutating and validating webhook?**
A: Mutating webhooks modify resources (inject defaults, add sidecars) and run first. Validating webhooks accept/reject and run second. This order matters — validators see the mutated version. Both are called by the API server before persisting to etcd.

**Q: How do you ensure your controller is idempotent?**
A:
- Always compare desired vs actual state, don't assume what happened before
- Use `CreateOrUpdate` patterns — check if resource exists before creating
- Use resource versions for optimistic concurrency (conflict detection)
- Set owner references so child resources are garbage collected automatically
- Don't store state in the controller — use the status subresource
