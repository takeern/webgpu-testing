import { memo, useEffect, useRef, useState } from "react"
import BasePage from "@/components/base-page"
import yuvBuffer from 'yuv-buffer'
import yuvCanvas from 'yuv-canvas'

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

  const testWebglRender = async () => {
    if (!canvasRef.current) return;

    if (!(window as any).webglR) {
      const render = yuvCanvas.attach(canvasRef.current, { webgl: true });
      (window as any).webglR = render;
    }

    const img = await loadYuv2('http://localhost:3000/frame', 768, 1280);

    console.time('webgl render time')
    const format = yuvBuffer.format({
      width: 720,
      height: img.height,
      chromaWidth: 720 / 2,
      chromaHeight: img.height / 2,
    });

    const frame = yuvBuffer.frame(format,
      {
        bytes: new Uint8Array(img.y),
        stride: img.width,
      },
      {
        bytes: new Uint8Array(img.u),
        stride: img.width / 2,
      },
      {
        bytes: new Uint8Array(img.v),
        stride: img.width / 2,
      },
    );

    (window as any).webglR.drawFrame(frame);

    console.timeEnd('webgl render time')
  }

  const testRender = async () => {
    if (renderIndex > 100) {
      return;
    }

    renderIndex++;
    await testWebglRender();

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
      <h1>test webgl render</h1>
      <canvas style={{
        width: 700,
        height: 500,
        objectFit: 'contain'
      }} width={768} height={1280} ref={canvasRef}  />
    </BasePage>
  )
}

export default memo(M);