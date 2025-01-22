import { motion } from 'framer-motion';

const RippleWaveLoader = () => {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(7)].map((_, index) => ( // Reduced the number of bars to 5 for compactness
        <motion.div
          key={index}
          className="h-3 w-1 rounded-full bg-background" // Smaller size (h-4, w-1)
          animate={{
            scaleY: [0.5, 1.5, 0.5],
            scaleX: [1, 0.8, 1],
            translateY: ['0%', '-15%', '0%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  );
};

export default RippleWaveLoader;