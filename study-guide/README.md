# PlayStation Systems Engineer — Interview Study Guide

## Interview Format
- Two technical rounds, one hour each
- Experience questions + technical deep dives
- Topics: K8s, CRD/API Design, Systems Design, Platform DX, Networking/Service Mesh, Security, Resiliency/Observability

## Study Materials

| File | What It Is | When to Use |
|------|-----------|-------------|
| `01-kubernetes-architecture.md` | K8s internals, components, how everything fits together | Friday evening — start here |
| `02-api-crd-design.md` | CRDs, Operators, controller pattern, API design | Saturday morning |
| `03-systems-design.md` | Platform design scenarios with full walkthroughs | Saturday afternoon |
| `04-developer-platform-experience.md` | DX principles, IDP patterns, real-world examples | Saturday evening |
| `05-networking-service-mesh.md` | K8s networking, Istio, Envoy, traffic management | Sunday morning |
| `06-security.md` | RBAC, NetworkPolicies, secrets, supply chain | Sunday midday |
| `07-resiliency-observability.md` | Probes, PDBs, Prometheus, tracing, SLOs | Sunday afternoon |
| `cheat-sheet.md` | One-page quick reference for all topics | Sunday night / morning of |
| `mock-interview.md` | 30 mock questions across all topics — practice out loud | Sunday evening |

## 3-Day Study Plan

### Friday Evening (3-4 hours)
1. Read `01-kubernetes-architecture.md` end to end
2. Install minikube: `brew install minikube && minikube start`
3. Run through these commands to build muscle memory:
   ```bash
   kubectl get nodes
   kubectl create namespace test
   kubectl run nginx --image=nginx -n test
   kubectl get pods -n test
   kubectl expose pod nginx --port=80 --type=ClusterIP -n test
   kubectl get svc -n test
   kubectl describe pod nginx -n test
   kubectl delete namespace test
   ```
4. Skim `02-api-crd-design.md`

### Saturday (6-8 hours)
1. Deep read `02-api-crd-design.md` — practice explaining the controller reconciliation loop out loud
2. Read `03-systems-design.md` — work through each scenario on paper/whiteboard
3. Read `04-developer-platform-experience.md`
4. Try deploying a simple app with a Service and Ingress on minikube

### Sunday (6-8 hours)
1. Read `05-networking-service-mesh.md`, `06-security.md`, `07-resiliency-observability.md`
2. Review `cheat-sheet.md`
3. Go through `mock-interview.md` — answer each question OUT LOUD as if you're in the interview
4. Re-read `cheat-sheet.md` before bed

## Interview Day Tips
- It's OK to say "I haven't worked with that in production, but here's my understanding..."
- Always start systems design with clarifying questions
- Draw diagrams — even verbally, say "I'd draw this as..."
- Connect everything back to developer experience — that's what this role is about
- Ask good questions at the end about their platform, team challenges, tech stack decisions
