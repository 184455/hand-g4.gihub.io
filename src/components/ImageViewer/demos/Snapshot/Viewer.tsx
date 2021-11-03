import React, {
  CSSProperties,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
// @ts-ignore
import { ImageViewer } from 'dumi-demo';
import styles from './Viewer.less';

export interface Props {
  initX: number;
  initY: number;
  src: string;
  onClose: () => void;
}

const Viewer: React.FC<Props> = (props) => {
  const { initX, initY, src, onClose } = props;
  const [top, setTop] = useState(initY);
  const [left, setLeft] = useState(initX);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeRef = useRef({ x: initX, y: initY, top: initY, left: initX });
  const moveRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    document.body.classList.add(styles['body-resize']);
    // @ts-ignore
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }, []);

  const handleResizeStart = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      left,
      top,
    };
    document.body.classList.add(styles['body-resize']);
    // @ts-ignore
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResize = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y, left: _left, top: _top } = resizeRef.current;
    const reHeight = e.clientY - y;
    const reWidth = e.clientX - x;
    if (height + reHeight >= 0) {
      setTop(_top);
      setHeight(height + reHeight);
    } else {
      setTop(_top + height + reHeight);
      setHeight(Math.abs(height + reHeight));
    }
    if (width + reWidth >= 0) {
      setLeft(_left);
      setWidth(width + reWidth);
    } else {
      setLeft(_left + width + reWidth);
      setWidth(Math.abs(width + reWidth));
    }
  };

  const handleResizeEnd = () => {
    document.body.classList.remove(styles['body-resize']);
    // @ts-ignore
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleMoveStart = (e: MouseEvent<HTMLDivElement>) => {
    moveRef.current = {
      x: e.clientX,
      y: e.clientY,
      left,
      top,
    };
    document.body.classList.add(styles['body-resize']);
    // @ts-ignore
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMoveEnd);
  };

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y, left: originLeft, top: originTop } = moveRef.current;
    setTop(e.clientY - y + top);
    setLeft(e.clientX - x + left);
  };

  const handleMoveEnd = () => {
    document.body.classList.remove(styles['body-resize']);
    // @ts-ignore
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleMoveEnd);
  };

  const style: CSSProperties = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };

  const handleLock = () => {
    setLock({
      left,
      top,
      width,
      height,
    });
  };

  const handleClose = () => {
    onClose();
  };

  const imageViewerProps = useMemo(() => {
    if (lock) {
      return {
        x: lock.left,
        y: lock.top,
        width: lock.width,
        height: lock.height,
      };
    }
    return {
      x: left,
      y: top,
      width: width,
      height: height,
    };
  }, [lock, left, top, width, height]);

  return (
    <>
      <div style={style} className={styles.viewer}>
        <div className={styles.wrapper}>
          <ImageViewer
            src={src}
            {...imageViewerProps}
            onMouseDown={handleMoveStart}
            onDoubleClick={handleClose}
          />
          {!lock && (
            <div
              className={styles['resize-box']}
              onMouseDown={handleResizeStart}
            />
          )}
          {!lock && (
            <div className={styles['options-container']}>
              <button onClick={handleLock}>√</button>
              <button onClick={handleClose}>×</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Viewer;
