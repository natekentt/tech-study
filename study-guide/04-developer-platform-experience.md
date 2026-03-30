# Developer & Platform Experience

This is arguably your most important topic. The job title is literally about developer experience. Even if your Kubernetes knowledge is lighter, demonstrating strong DX instincts will set you apart.

## What is Platform Engineering?

Platform engineering is building **internal products** that make developers productive. The "customers" are your fellow engineers. You're not writing application code — you're building the tools, abstractions, and workflows that let application developers ship faster.

### The Platform as a Product
- Treat your platform like a product with real users
- Developers are your customers — they have choices (or will work around you)
- Measure success by adoption, developer satisfaction, and time-to-production
- Iterate based on feedback, not assumptions

## Core Principles of Great Developer Experience

### 1. Golden Paths, Not Golden Cages
- Provide a **paved road** (the easy, supported way to do things)
- Don't block the **unpaved road** (teams with special needs can customize)
- Example: "Use our Application CRD and get CI/CD, monitoring, and networking for free. Or bring your own Helm chart if you need full control."

### 2. Sensible Defaults with Escape Hatches
- Every platform decision should have a good default
- Developers shouldn't need to configure 50 fields to deploy a service
- But power users should be able to override any default
```yaml
# Minimal config — sensible defaults fill in the rest
apiVersion: platform.playstation.com/v1
kind: Application
metadata:
  name: my-service
spec:
  repository: github.com/sie/my-service
  # That's it. Defaults handle:
  # - scaling (min 2, max 10)
  # - resources (500m CPU, 512Mi memory)
  # - networking (ClusterIP service, standard ingress)
  # - monitoring (Prometheus scrape, default dashboard)
```

### 3. Fast Feedback Loops
- Deploy to dev in < 5 minutes (not 30)
- Build failures should be reported in < 2 minutes
- Logs and metrics should be available immediately after deploy
- Previw environments for every PR (ephemeral namespaces)

### 4. Self-Service Over Tickets
- A developer should NEVER need to file a ticket to:
  - Create a new service
  - Deploy to a new environment
  - Get access to logs and metrics
  - Scale their service
- Tickets = bottleneck = frustrated developers = shadow IT

### 5. Guardrails, Not Gates
- Don't block developers — guide them
- Use admission webhooks to enforce policies automatically
- Provide warnings for non-critical issues, blocks only for critical ones
- Example: Pod without resource limits → mutating webhook adds defaults (not rejection)

## The Internal Developer Platform (IDP) Stack

```
┌─────────────────────────────────────────┐
│         Developer Interface              │
│   (Portal, CLI, IDE plugins, ChatOps)   │
├─────────────────────────────────────────┤
│         Platform APIs (CRDs)            │
│   (Application, Pipeline, Environment)  │
├─────────────────────────────────────────┤
│         Platform Controllers            │
│   (Operators that reconcile CRDs)       │
├─────────────────────────────────────────┤
│         Infrastructure                   │
│   (K8s, cloud services, networking)     │
└─────────────────────────────────────────┘
```

Each layer **hides the complexity** of the layer below it:
- Developers interact with the top layer (Portal/CLI)
- They don't need to know about Kubernetes, RBAC, NetworkPolicies, Prometheus
- The platform team manages the abstractions in between

## Developer Portal (Backstage Pattern)

Many companies (including large gaming companies) use Backstage-like portals:

**What it provides:**
- **Service catalog**: Who owns what? What services exist? Dependencies?
- **Templates**: "Create new Go microservice" → generates repo, CI/CD, monitoring, K8s configs
- **Docs**: Centralized technical documentation
- **Scorecards**: Service maturity tracking (has tests? has runbook? SLOs defined?)
- **Plugin ecosystem**: Extend with custom features

**Why this matters for PlayStation:**
- 1,000+ engineers across multiple studios
- Need consistent service creation and discovery
- Onboarding new engineers should be fast (browse catalog, use templates)

## Platform CLI

A CLI is often the primary developer interface:

```bash
# Create a new service from template
psx create service --name matchmaking --template go-grpc

# Deploy to dev
psx deploy --env dev

# Check service status
psx status matchmaking

# View logs
psx logs matchmaking --env staging --since 1h

# Open service dashboard
psx dashboard matchmaking

# Promote from staging to prod
psx promote matchmaking --from staging --to prod
```

### CLI Design Principles
- Consistent verb-noun pattern (create, deploy, status, logs)
- Helpful error messages with suggested fixes
- Auto-completion for service names, environments
- Interactive mode for complex operations
- Machine-readable output (--json) for scripting

## Measuring Platform Success

### Key Metrics
- **Deployment frequency**: How often can teams ship?
- **Lead time**: From commit to production
- **MTTR**: Mean time to recovery from incidents
- **Developer satisfaction** (NPS/survey): Do developers like using the platform?
- **Adoption rate**: What percentage of teams use the platform?
- **Time to first deploy**: How fast can a new service go from idea to running in production?

### DORA Metrics (know these)
1. **Deployment frequency** — How often you ship
2. **Lead time for changes** — Commit to production
3. **Change failure rate** — % of deployments causing incidents
4. **Time to restore service** — How fast you recover

Elite teams: deploy multiple times/day, < 1 hour lead time, < 5% failure rate, < 1 hour recovery.

## Real-World DX Patterns

### Environment Parity
- Dev, staging, and prod should be as similar as possible
- Same Kubernetes configs, same service mesh, same observability
- Differences only in scale and data
- This prevents "works in dev, breaks in prod" issues

### Preview Environments
```yaml
# On PR creation, spin up an ephemeral environment
apiVersion: platform.playstation.com/v1
kind: PreviewEnvironment
metadata:
  name: pr-1234-matchmaking
spec:
  pullRequest: 1234
  repository: github.com/sie/matchmaking-service
  ttl: 72h  # Auto-cleanup after 3 days
```

### Developer Onboarding
- New engineer → browse service catalog → pick template → running service in < 30 minutes
- All services come with monitoring, logging, deployment pipeline by default
- Documentation is part of the platform, not a separate wiki

## Interview Questions

**Q: How do you measure the success of a developer platform?**
A: I'd use a combination of quantitative metrics (DORA metrics: deployment frequency, lead time, change failure rate, MTTR) and qualitative metrics (developer satisfaction surveys, NPS scores). I'd also track adoption rate — if teams are choosing NOT to use the platform, that's a signal. Time to first deploy for new services is another key metric — how fast can a team go from zero to production?

**Q: A team says your platform is too restrictive. How do you handle it?**
A: First, listen. Understand their specific pain point. Are they blocked by a real limitation, or do they not know about an existing escape hatch? If it's a real limitation, I'd evaluate: Is this a common need (build it into the platform) or a one-off (provide an escape hatch)? The goal is golden paths, not golden cages. Every constraint should have a justification, and power users should be able to override non-critical defaults.

**Q: How do you balance standardization with team autonomy?**
A: Standardize the things that benefit from consistency (observability, security, deployment patterns, networking) and leave application-level decisions to teams (language choice, frameworks, internal architecture). The platform should have opinions but not be opinionated about everything. I think of it as: standardize the "how you ship" not the "what you build."

**Q: Describe how you'd design a self-service experience for teams to create new services.**
A: I'd build a service template system — either through a portal (Backstage-style) or CLI. A developer picks a template (Go microservice, Python API, etc.), provides a name and team, and the platform generates: a Git repo with scaffolding, CI/CD pipeline, Kubernetes configs, monitoring dashboards, and an entry in the service catalog. All through a CRD (ServiceTemplate) that a controller reconciles. The goal: zero tickets, first deploy within 30 minutes.

**Q: What makes a platform API "good"?**
A: A good platform API is: declarative (describe what you want, not how), has sensible defaults (minimal config for common cases), is consistent (same patterns everywhere), is well-documented with examples, provides clear error messages, and is versioned (so you can evolve without breaking users). Basically — would I want to use this API as a developer? If the answer is no, iterate until it is.
