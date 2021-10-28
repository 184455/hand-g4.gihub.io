import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { LayoutType } from './interface';
import styles from './index.less';

interface Props {
  activeDividerClassName?: string;
  activeDividerStyle?: React.CSSProperties;
  asyncDragMoved?: number;
  children: React.ReactNode;
  dividerClassName?: string;
  dividerStyle?: React.CSSProperties;
  globalActiveDividerClassName?: string;
  globalActiveDividerStyle?: React.CSSProperties;
  globalDividerClassName?: string;
  globalDividerStyle?: React.CSSProperties;
  last: boolean;
  layout: LayoutType;
  onDragStart: MouseEventHandler<HTMLDivElement>;
  onDrag: MouseEventHandler<HTMLDocument>;
  onDragEnd: MouseEventHandler<HTMLDocument>;
  onVectorChange?: (vector: number) => void;
  vector?: number;
  boxClassName?: string;
  boxStyle?: React.CSSProperties;
}

const Box: React.FC<Props> = (props) => {
  const {
    activeDividerClassName,
    activeDividerStyle,
    asyncDragMoved,
    dividerClassName,
    dividerStyle,
    globalActiveDividerClassName,
    globalActiveDividerStyle,
    globalDividerClassName,
    globalDividerStyle,
    children,
    last,
    vector,
    layout,
    onDragStart,
    onDrag,
    onDragEnd,
    onVectorChange,
    boxClassName,
    boxStyle,
  } = props;
  const vectorAttrName = layout === LayoutType.horizontal ? 'width' : 'height';
  const clientVectorAttrName =
    layout === LayoutType.horizontal ? 'clientWidth' : 'clientHeight';
  const positionAttrName =
    layout === LayoutType.horizontal ? 'right' : 'bottom';
  const [dragging, setDragging] = useState(false);
  const [dividerHovering, setDividerHovering] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onVectorChange instanceof Function && boxRef.current) {
      onVectorChange(boxRef.current[clientVectorAttrName]);
    }
  }, [vector, clientVectorAttrName]);

  const handleMouseDown = useCallback((e) => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    onDragStart(e);
    setDragging(true);
  }, []);

  // @ts-ignore
  const handleMouseMove = (e) => {
    onDrag(e);
  };

  // @ts-ignore
  const handleMouseUp = (e) => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
    onDragEnd(e);
    setDragging(false);
  };

  const finalBoxStyle = useMemo(() => {
    const style = {
      ...(boxStyle || {}),
    };
    if (typeof vector === 'number') {
      Object.assign(style, {
        [vectorAttrName]: `${vector}px`,
        flex: 'none',
      });
    } else {
      Object.assign(style, {
        flex: '1',
      });
    }
    return style;
  }, [vector, vectorAttrName]);

  const handleDividerMouseEnter = useCallback(() => {
    setDividerHovering(true);
  }, []);

  const handleDividerMouseLeave = useCallback(() => {
    setDividerHovering(false);
  }, []);

  const finalBoxClassName = useMemo(() => {
    return classNames(styles['draggable-box'], boxClassName, {
      [styles.dragging]: dragging,
    });
  }, [boxClassName, dragging]);

  const finalDividerClassName = useMemo(() => {
    return classNames(
      styles.divider,
      dividerClassName,
      globalDividerClassName,
      (dragging || dividerHovering) && activeDividerClassName,
      (dragging || dividerHovering) && globalActiveDividerClassName,
    );
  }, [
    activeDividerClassName,
    dividerClassName,
    globalActiveDividerClassName,
    globalDividerClassName,
    dragging,
    dividerHovering,
  ]);

  const finalDividerStyle = useMemo(() => {
    const style = {
      ...(globalDividerStyle || {}),
      ...(dividerStyle || {}),
    };
    if (dragging || dividerHovering) {
      Object.assign(
        style,
        globalActiveDividerStyle || {},
        activeDividerStyle || {},
      );
    }
    if (typeof asyncDragMoved === 'number') {
      Object.assign(style, {
        [positionAttrName]: `${-asyncDragMoved}px`,
      });
    }
    return style;
  }, [
    activeDividerStyle,
    dividerStyle,
    globalActiveDividerStyle,
    globalDividerStyle,
    dragging,
    dividerHovering,
    asyncDragMoved,
  ]);

  return (
    <div className={finalBoxClassName} style={finalBoxStyle} ref={boxRef}>
      {children}
      {!last && (
        <>
          <hr
            className={classNames(styles.divider, styles['normal-divider'])}
          />
          <hr
            className={finalDividerClassName}
            style={finalDividerStyle}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleDividerMouseEnter}
            onMouseLeave={handleDividerMouseLeave}
          />
        </>
      )}
    </div>
  );
};

export default Box;
