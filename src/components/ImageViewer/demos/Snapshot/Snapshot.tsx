import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
import Viewer, { Props as ViewerProps } from './Viewer';
import styles from './Snapshot.less';

const Snapshot: React.FC = () => {
  const [snapping, setSnapping] = useState(false);
  const [snapList, setSnapList] = useState<
    Array<ViewerProps & { key: number }>
  >([]);
  const [snapSrc, setSnapSrc] = useState('');
  const elRef = useRef(document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(elRef.current);
    return () => elRef.current.remove();
  }, []);

  useEffect(() => {
    const handleResize = async () => {
      const canvas = await html2canvas(document.body.querySelector('#root')!);
      setSnapSrc(canvas.toDataURL());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSnapshot = async () => {
    const canvas = await html2canvas(document.body.querySelector('#root')!);
    setSnapSrc(canvas.toDataURL());
    setSnapping(true);
  };

  const handleSnapStart = (e: MouseEvent<HTMLDivElement>) => {
    const key = Date.now();
    const viewerProps: ViewerProps & { key: number } = {
      key,
      initX: e.clientX,
      initY: e.clientY,
      src: snapSrc,
      onClose: () =>
        setSnapList((pre) => pre.filter((viewer) => viewer.key !== key)),
    };
    setSnapList([...snapList, viewerProps]);
  };

  const handleClose = () => {
    setSnapList([]);
    setSnapping(false);
  };

  return (
    <>
      {ReactDOM.createPortal(
        <>
          {snapping && (
            <div className={styles.mask} onMouseDown={handleSnapStart} />
          )}
          {snapping && (
            <button className={styles['close-button']} onClick={handleClose}>
              ×
            </button>
          )}
          {snapList.map((viewerProps, index) => (
            <Viewer {...viewerProps} src={snapSrc} />
          ))}
        </>,
        elRef.current,
      )}
      <button onClick={handleSnapshot}>snapshot</button>
    </>
  );
};

export default Snapshot;
