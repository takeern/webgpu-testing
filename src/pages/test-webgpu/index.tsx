import { memo, useEffect, useRef, useState } from "react"
import BasePage from "@/components/base-page"
import WebGpuYuvRender from "./webgpuRender";

let index = 0;
let renderIndex = 0;


const loadYuv2 = async (url: string, width = 800, height = 800) => {
  const loadSource = (path: string) => {
    return fetch(path).then(res => res.blob()).then(res => res.arrayBuffer());
  }

  const res = await Promise.all([
    loadSource(url + '.y'),
    loadSource(url + '.u'),
    loadSource(url + '.v'),
  ])
  // 422
  const total = new Uint8Array(width * height * 2);
  const [y , u, v] = res;
  total.set(new Uint8Array(y), 0);
  total.set(new Uint8Array(u), width * height);
  total.set(new Uint8Array(v), width * height * 1.25);
  return {
    data: total,
    y, u, v,
    width,
    height,
  };
}

const M = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [info, setInfo] = useState({
    width: 400,
    height: 300,
  });


  const testWebGpuRender = async () => {
    if (!canvasRef.current) return;

    if (!(window as any).webgpuR) {
      const render = new WebGpuYuvRender(canvasRef.current, {});
      await render.init();
      (window as any).webgpuR = render;
    }

    

    const img = await loadYuv2('http://localhost:3000/frame', 768, 1280);
    // setInfo({
    //   width: img.width,
    //   height: img.height
    // });
    console.time('webgpu time render')
    await (window as any).webgpuR.drawFrame({
      buf_y: new Uint8Array(img.y),
      buf_u: new Uint8Array(img.u),
      buf_v: new Uint8Array(img.v),
      stride_y: 768,
      stride_u: 768 / 2,
      stride_v: 768 / 2,
      width: 720,
      height: 1280,
      renderTime: 0
    })
    console.timeEnd('webgpu time render')
  }

  const testRender = async () => {
    if (renderIndex > 100) {
      return;
    }

    renderIndex++;
    await testWebGpuRender();

    requestAnimationFrame(testRender)
  }

  useEffect(() => {
    if (canvasRef.current && !index) {
      // createLib();
      console.log('canvasRef.current', canvasRef.current)
      // testCompute();
      // testRenderImg();
      testRender();
      index++;
    }
  }, [])

  return (
    <BasePage title='simple triangle - WebGPU'>
      <canvas style={{
        width: 700,
        height: 500,
        objectFit: 'contain'
      }} width={768} height={1280} ref={canvasRef}  />
    </BasePage>
  )
}

export default memo(M); 