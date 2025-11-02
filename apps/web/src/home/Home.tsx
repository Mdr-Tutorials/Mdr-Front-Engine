import { MdrButton } from '@mdr/ui';
import './Home.scss'

function Home() {
    return (
        <div className="home">
            <nav className="nav">
                <div className="nav-left">
                    <svg width="30" height="30" viewBox="0 0 701 615" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 564C50 564 50 480.791 50 398M350 140L200 50L50 140C50 140 50 315.209 50 398M350 140L500 50L650 140M350 140V352M50 398L200 321M350 352V564L500 519L650 564M350 352L500 282L650 352" stroke="black" stroke-width="100" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
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