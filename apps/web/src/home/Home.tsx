import { IconMdr } from '../components/icons/IconMdr';
import { MdrButtonLink, MdrNav } from '@mdr/ui';
import './Home.scss'
import { MIRRenderer } from '@/mir/renderer/MIRRenderer';
import { testDoc } from '@/mock/pagaData';
import { ExportModal } from '@/editor/features/export/ExportModal';
import { Download, Footprints } from 'lucide-react';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactCode } from '@/mir/generator/mirToReact';

function Home() {
    const globalState = {
        buttonText: "张三 (来自 Logic State)",
    };

    const globalParams = {
        themeColor: "#ff0000"
    };
    const { setGeneratedCode, setExportModalOpen } = useEditorStore();

    const handleQuickExport = () => {
        // 1. 生成代码（默认生成 React，弹窗内可以再切换）
        const code = generateReactCode(testDoc);
        // 2. 存入 Store
        setGeneratedCode(code);
        // 3. 打开弹窗
        setExportModalOpen(true);
    };
    return (
        <div className="home">
            <MdrNav className='nav'>
                <MdrNav.Left>
                    <IconMdr size={30} color="black" />
                    <MdrNav.Heading heading="MdrFrontEngine" />
                </MdrNav.Left>
                <MdrNav.Right><p>社区</p><p>教程</p><p>文档</p></MdrNav.Right>
            </MdrNav>
            <div className="content">
                <div className="titles">
                    <h1 className="">
                        不仅是<span>前端可视化开发平台</span>
                    </h1>
                    <h1 className="">
                        还是 <span>UI/UX 设计语言</span>
                    </h1>
                    <h1>更是<span>从设计到部署的全流程解决方案</span></h1>
                </div>
                <h2>- 结合蓝图、节点图和代码；打通设计、开发、测试、构建和部署；跨领域开发前端、快速开发 MVP 和学习前端的优质选择。</h2>
                <div className="button-bar">
                    <MdrButtonLink text="进入编辑器" size='Big' category='Primary' to={"/editor"} />
                    <MdrButtonLink text="查看文档" size='Big' category='Secondary' to={"http://localhost:5174"} />
                </div>

                <section className="divider">
                    <h2>测试 MIR 渲染器</h2>

                    <MIRRenderer
                        node={testDoc.ui.root}
                        mirDoc={testDoc}
                    />
                    <button
                        onClick={handleQuickExport}
                        className="export-button"
                    >
                        <Download size={16} />
                        <span>导出组件代码</span>
                    </button>
                </section>
            </div>

            <ExportModal />

            <footer className='footer'>
                <div className="footer-left">
                    <IconMdr size={16} color="black" />
                    <span>MdrFrontEngine © 2026</span>
                </div>
                <div className="footer-right">
                    <Footprints size={16} />
                    <span>临时占位 footer</span>
                </div>
            </footer>
        </div>
    );

}
export default Home