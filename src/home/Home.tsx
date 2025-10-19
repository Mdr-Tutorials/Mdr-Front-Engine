import Button from '../components/ui/Button';
import './Home.css'

function Home() {
    return (
        <div className="home">
            <nav className="nav">
                <div className="nav-left">
                    <p>MdrFrontEngine</p>
                </div>
                <div className="nav-right">
                    <p>社区</p>
                </div>
            </nav>
            <div className="content">
                <div className="titles">
                    <h1 className="">
                        不仅是<span>开源可视化前端开发平台</span>
                    </h1>
                    <h1 className="">
                        还是 <span>UI/UX 设计语言</span>
                    </h1>
                    <h1>更是<span>从设计到部署的全流程解决方案</span></h1>
                </div>
                <div className="buttons">
                    <Button text="进入编辑器" />
                </div>
            </div>
        </div>
    );

}
export default Home