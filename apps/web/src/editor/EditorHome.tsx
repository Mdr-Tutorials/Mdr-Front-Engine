import { useCallback, useEffect, useState } from "react"
import { MdAdd } from "react-icons/md"
import { MdrButton } from "@mdr/ui"
import EditorBar from "./EditorBar/EditorBar"
import "./EditorHome.scss"
import { TIPS } from "./tips"

function EditorTipsRandom() {
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

    const tip = TIPS[active];

    return (
        <div className="EditorHomeSmallTip" onClick={clickNext}>
            <p>Tip: {tip.body}</p>
        </div>
    );
}


function EditorHome() {
    const handleNewProject = useCallback(() => {
        console.info("Start new project flow")
    }, [])

    return (
        <div className="EditorHome">
            <EditorBar state={0} />

            <section className="EditorHomeMainCentered">
                <header className="EditorHomeHeaderCentered">
                    <h1 className="EditorHomeTitle">欢迎来到 MdrFrontEngine</h1>
                </header>

                <div className="EditorHomeBigAction">
                    <MdrButton
                        text="新建项目"
                        iconPosition="Left"
                        size="Big"
                        icon={<MdAdd size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={handleNewProject}
                    />
                    <MdrButton
                        text="新建独立组件"
                        iconPosition="Left"
                        size="Big"
                        icon={<MdAdd size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={handleNewProject}
                    />
                    <MdrButton
                        text="新建独立节点图"
                        iconPosition="Left"
                        size="Big"
                        icon={<MdAdd size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={handleNewProject}
                    />
                    <MdrButton
                        text="新建项目"
                        iconPosition="Left"
                        size="Big"
                        icon={<MdAdd size={165} />}   // 巨大图标
                        className="EditorHomeNewProjectHugeButton"
                        onClick={handleNewProject}
                    />
                </div>

                <EditorTipsRandom />
            </section>

        </div>
    )

}
export default EditorHome
