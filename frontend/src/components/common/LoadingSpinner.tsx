import React from 'react';
import styled, { keyframes, css } from 'styled-components';

// 動畫定義
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

// 樣式組件
const SpinnerContainer = styled.div<{ size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${props => {
    switch (props.size) {
      case 'small':
        return 'width: 20px; height: 20px;';
      case 'medium':
        return 'width: 40px; height: 40px;';
      case 'large':
        return 'width: 60px; height: 60px;';
      default:
        return 'width: 40px; height: 40px;';
    }
  }}
`;

const Spinner = styled.div<{ variant: string; size: string }>`
  ${props => {
    const sizeMap = {
      small: '20px',
      medium: '40px',
      large: '60px'
    };
    const size = sizeMap[props.size as keyof typeof sizeMap] || '40px';
    
    switch (props.variant) {
      case 'dots':
        return css`
          width: ${size};
          height: ${size};
          position: relative;
          
          &::before,
          &::after,
          & {
            border-radius: 50%;
            width: 8px;
            height: 8px;
            background: #667eea;
            animation: ${pulse} 1.4s infinite ease-in-out both;
          }
          
          &::before,
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
          }
          
          &::before {
            left: -15px;
            animation-delay: -0.32s;
          }
          
          &::after {
            left: 15px;
            animation-delay: 0.32s;
          }
        `;
      
      case 'bounce':
        return css`
          width: ${size};
          height: ${size};
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          animation: ${bounce} 1.4s infinite ease-in-out;
        `;
      
      default: // spinner
        return css`
          width: ${size};
          height: ${size};
          border: 3px solid rgba(102, 126, 234, 0.1);
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: ${spin} 1s linear infinite;
        `;
    }
  }}
`;

const LoadingText = styled.span<{ size: string }>`
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '0.875rem';
      case 'large': return '1.125rem';
      default: return '1rem';
    }
  }};
  font-weight: 500;
`;

const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
`;

// 組件屬性類型
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'bounce';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

// 主要組件
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'spinner',
  text,
  fullScreen = false,
  className
}) => {
  const spinnerElement = (
    <SpinnerContainer size={size} className={className}>
      <Spinner variant={variant} size={size} />
      {text && <LoadingText size={size}>{text}</LoadingText>}
    </SpinnerContainer>
  );

  if (fullScreen) {
    return (
      <FullScreenContainer>
        {spinnerElement}
      </FullScreenContainer>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
