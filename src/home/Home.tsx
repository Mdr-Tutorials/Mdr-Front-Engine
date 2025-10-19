import MdrButton from '../components/ui/MdrButton';
import './Home.css'

function Home() {
    return (
        <div className="home">
            <nav className="nav">
                <div className="nav-left">
                    <p>MdrFrontEngine</p>
                </div>
                <div className="nav-right">
                    <p>社区</p><p>教程</p><p>文档</p>
                </div>
            </nav>
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
                    <MdrButton text="进入编辑器" size='Big' category='Primary' />
                    <MdrButton text="查看文档" size='Big' category='Secondary' />
                </div>
            </div>
        </div>
    );

}
export default Home