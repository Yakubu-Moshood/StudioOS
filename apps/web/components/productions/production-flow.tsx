import { getBriefVersions } from '@/app/actions/briefs'
import { getResearchVersions } from '@/app/actions/research'
import { getScriptVersions } from '@/app/actions/scripts'
import { getProductionPackageVersions } from '@/app/actions/production-packages'
import { getCreativeStageVersions } from '@/app/actions/creative-stages'
import type { ProductionWorkflowView } from '@/app/actions/productions'
import { BriefPanel } from './brief-panel'
import { ClientDiscoveryPanel } from './client-discovery-panel'
import { ResearchPanel } from './research-panel'
import { BigCreativeIdeaPanel } from './big-creative-idea-panel'
import { ConceptDevelopmentPanel } from './concept-development-panel'
import { ScriptPanel } from './script-panel'
import { PkgPanel } from './pkg-panel'
import { PkgReview } from './pkg-review'
import { WorkflowOverview } from './workflow-overview'

export async function ProductionFlow(props: {
  projectId: string
  productionId: string
  workflow: ProductionWorkflowView
}) {
  const [briefs, research, bigIdeas, concepts, scripts, packages] = await Promise.all([
    getBriefVersions(props.productionId),
    getResearchVersions(props.productionId),
    getCreativeStageVersions(props.productionId, 'big_creative_idea'),
    getCreativeStageVersions(props.productionId, 'concept_development'),
    getScriptVersions(props.productionId),
    getProductionPackageVersions(props.productionId),
  ])

  const task = (key: string) =>
    props.workflow.stages.flatMap((stage) => stage.tasks).find((item) => item.task_key === key)
  const ready = (key: string) => ['ready', 'failed'].includes(task(key)?.status ?? '')
  const latestPackage = packages[0] ?? null
  const isAdvertising = props.workflow.production.production_type === 'advertising_campaign'

  return (
    <div className="grid gap-6">
      {isAdvertising ? <WorkflowOverview stages={props.workflow.stages} /> : null}
      {isAdvertising ? (
        <ClientDiscoveryPanel projectId={props.projectId} productionId={props.productionId} versions={briefs} />
      ) : (
        <BriefPanel projectId={props.projectId} productionId={props.productionId} versions={briefs} />
      )}
      <ResearchPanel
        projectId={props.projectId}
        productionId={props.productionId}
        canGenerate={ready('generate_research')}
        versions={research}
        mode={isAdvertising ? 'strategic_discovery' : 'research'}
      />
      {isAdvertising ? (
        <>
          <BigCreativeIdeaPanel
            projectId={props.projectId}
            productionId={props.productionId}
            canGenerate={ready('complete_big_creative_idea')}
            versions={bigIdeas}
          />
          <ConceptDevelopmentPanel
            projectId={props.projectId}
            productionId={props.productionId}
            canGenerate={ready('complete_concept_development')}
            versions={concepts}
          />
        </>
      ) : null}
      <ScriptPanel
        projectId={props.projectId}
        productionId={props.productionId}
        canGenerate={ready('generate_script')}
        versions={scripts}
        mode={isAdvertising ? 'advertising_script' : 'script'}
      />
      <PkgPanel
        projectId={props.projectId}
        productionId={props.productionId}
        enabled={ready('assemble_production_package')}
        versions={packages}
      />
      {latestPackage && !latestPackage.approval ? (
        <PkgReview projectId={props.projectId} productionId={props.productionId} version={latestPackage} />
      ) : null}
    </div>
  )
}
