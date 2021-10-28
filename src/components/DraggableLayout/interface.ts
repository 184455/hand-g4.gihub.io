import { ReactNode, CSSProperties } from 'react';

export enum LayoutType {
  horizontal = 'horizontal', // 水平
  vertical = 'vertical', // 垂直
}

export enum DragModelType {
  synchronous = 'synchronous', // 同步
  asynchronous = 'asynchronous', // 异步
}

export interface LayoutProps {
  /**
   * @description 拖拽时的分割线类名(全局)
   */
  activeDividerClassName?: string;
  /**
   * @description 拖拽时使用的分割线样式(全局)
   */
  activeDividerStyle?: CSSProperties;
  /**
   * @description 布局容器类名
   */
  className?: string;
  /**
   * @description 拖拽模式,同步/异步: synchronous | asynchronous
   * @default synchronous
   */
  dragModel?: DragModelType;
  /**
   * @description 全局分割线类名
   */
  dividerClassName?: string;
  /**
   * @description 全局分割线样式
   */
  dividerStyle?: CSSProperties;
  /**
   * @description 布局方式，水平/垂直: horizontal | vertical
   * @default horizontal
   */
  layout?: LayoutType;
  /**
   * @description 宽/高度变化时触发
   */
  onVectorsChange?: (vectors: number[]) => void;
  /**
   * @description 父容器尺寸变化时重新渲染的防抖延迟，单位ms
   * @default 0
   */
  resizeDebounce?: number;
  /**
   * @description 布局容器样式
   */
  style?: CSSProperties;
}

export interface WrapperProps {
  /**
   * @description 拖拽时的分割线类名
   */
  activeDividerClassName?: string;
  /**
   * @description 拖拽时使用的分割线样式
   */
  activeDividerStyle?: CSSProperties;
  /**
   * @description 内容
   */
  children: ReactNode;
  /**
   * @description 拖拽块容器类型
   */
  className?: string;
  /**
   * @description 分割线类名
   */
  dividerClassName?: string;
  /**
   * @description 分割线样式
   */
  dividerStyle?: CSSProperties;
  /**
   * @description 每一个子容器都需要一个key，默认使用index。在子容器index会变化时需要手动指定。
   */
  key?: string | number;
  /**
   * @description 最小宽/高度，单位支持px和%
   * @default 20px
   */
  minVector?: string;
  /**
   * @description 最大宽/高度，单位支持px和%
   * @default 100%
   */
  maxVector?: string;
  /**
   * @description 数值表示权重、字符串支持px和%
   * @default 1
   */
  initVector?: number | string;
  /**
   * @description 宽/高度变化时触发
   */
  onVectorChange?: (vector: number) => void;
  /**
   * @description 拖拽块容器样式
   */
  style?: CSSProperties;
}
