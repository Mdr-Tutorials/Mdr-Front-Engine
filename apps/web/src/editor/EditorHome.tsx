import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { MdrButton } from "@mdr/ui"
import "./EditorHome.scss"
import { TIPS, type TipId } from "./tips"
import NewProjectModal from "./features/newfile/NewProjectModal"
import NewComponentModal from "./features/newfile/NewComponentModal"
import NewNodeGraphModal from "./features/newfile/NewNodeGraphModal"

function EditorTipsRandom() {
    const { t } = useTranslation('editor')
    const tipsCount = TIPS.length;

    // 每个 tip 的历史权重（score），决定“重现概率降低”
    const [scores, setScores] = useState(() => Array(tipsCount).fill(1));

    // 当前激活的 tip index
    const [active, setActive] = useState(0);

    // ----------- 加权随机选择下一个 tip -----------
    const pickNextTip = useCallback(() => {
        // 计算“权重”= 1 / score
        const weights = scores.map(s => 1 / s);
        const total = weights.reduce((a, b) => a + b, 0);

        // 在 [0, total) 中随机抽一条
        let r = Math.random() * total;
        let next = 0;

        for (let i = 0; i < tipsCount; i++) {
            if (r < weights[i]) {
                next = i;
                break;
            }
            r -= weights[i];
        }

        // 避免抽到当前 active（可选）
        if (next === active && tipsCount > 1) {
            next = (active + 1) % tipsCount;
        }

        // 更新：为被选中 tip 的 score +1
        setScores(prev => {
            const clone = [...prev];
            clone[next] += 1;
            return clone;
        });

        setActive(next);
    }, [scores, active, tipsCount]);

    // ----------- 自动计时轮换 -----------
    useEffect(() => {
        const timer = setInterval(pickNextTip, 5000);
        return () => clearInterval(timer);
    }, [pickNextTip]);

    // ----------- 点击立刻切换 -----------
    const clickNext = () => pickNextTip();

    const tipId = TIPS[active] as TipId;

    return (
        <div className="EditorHomeSmallTip" onClick={clickNext}>
            <p>{t('tips.prefix')} {t(`tips.items.${tipId}.body`)}</p>
        </div>
    );
}


function EditorHome() {
    const { t } = useTranslation('editor')
    const [isProjectModalOpen, setProjectModalOpen] = useState(false)
    const [isComponentModalOpen, setComponentModalOpen] = useState(false)
    const [isNodeGraphModalOpen, setNodeGraphModalOpen] = useState(false)

    return (
        <div className="EditorHome">
            <section className="EditorHomeMainCentered">
                <header className="EditorHomeHeaderCentered">
                    <h1 className="EditorHomeTitle">{t('home.welcomeTitle')}</h1>
                </header>

                <div className="EditorHomeBigAction">
                    <MdrButton
                        text={t('home.actions.newProject')}
                        iconPosition="Left"
                        size="Big"
                        icon={<Plus size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={() => setProjectModalOpen(true)}
                    />
                    <MdrButton
                        text={t('home.actions.newComponent')}
                        iconPosition="Left"
                        size="Big"
                        icon={<Plus size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={() => setComponentModalOpen(true)}
                    />
                    <MdrButton
                        text={t('home.actions.newNodeGraph')}
                        iconPosition="Left"
                        size="Big"
                        icon={<Plus size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={() => setNodeGraphModalOpen(true)}
                    />
                    <MdrButton
                        text={t('home.actions.newProject')}
                        iconPosition="Left"
                        size="Big"
                        icon={<Plus size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                    />
                </div>

                <EditorTipsRandom />
            </section>

            <NewProjectModal open={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} />
            <NewComponentModal open={isComponentModalOpen} onClose={() => setComponentModalOpen(false)} />
            <NewNodeGraphModal open={isNodeGraphModalOpen} onClose={() => setNodeGraphModalOpen(false)} />
        </div>
    )

}
export default EditorHome
