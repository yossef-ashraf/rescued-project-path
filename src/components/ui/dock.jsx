'use client';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  createContext,
  useContext,
  useState,
} from 'react';
import { cn } from '@/shared/utils/utils.js';

const DockContext = createContext(undefined);

function DockProvider({ children, value }) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  return useContext(DockContext);
}

function Dock({ children, className }) {
  return (
    <div
      className={cn(
        'mx-auto flex h-12 w-fit items-center gap-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md backdrop-blur-md px-3 py-1.5',
        className
      )}
      role='toolbar'
      aria-label='Application dock'
    >
      <DockProvider value={{}}>
        {children}
      </DockProvider>
    </div>
  );
}

function DockItem({ children, className, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl cursor-pointer transition-colors duration-150',
        className
      )}
      role='button'
      tabIndex={0}
    >
      {Array.isArray(children)
        ? children.map((child, i) =>
            child ? (
              typeof child.type === 'function' || typeof child.type === 'object'
                ? { ...child, props: { ...child.props, isHovered } }
                : child
            ) : null
          )
        : children && (typeof children.type === 'function' || typeof children.type === 'object')
        ? { ...children, props: { ...children.props, isHovered } }
        : children}
    </div>
  );
}

function DockLabel({ children, className, isHovered }) {
  return (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: -26, scale: 1 }}
          exit={{ opacity: 0, y: 2, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute left-1/2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-zinc-800 shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-white pointer-events-none z-50',
            className
          )}
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, isHovered }) {
  return (
    <motion.div
      animate={{ scale: isHovered ? 1.25 : 1, y: isHovered ? -2 : 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      className={cn('flex items-center justify-center h-full w-full', className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
