import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { RootState } from '../store/store';
import { 
  firebaseLogin, 
  firebaseRegister, 
  clearFirebaseError,
  sendFirebasePasswordReset 
} from '../store/slices/firebaseAuthSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useFirebaseAuth from '../hooks/useFirebaseAuth';
import { testFirebaseConnection, diagnoseNetworkIssue } from '../utils/firebaseTest';

// 樣式組件 (重用之前的樣式)
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem 1rem;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LoginSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
`;

const FormTabs = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
    color: #ffffff;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ffffff;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ForgotPassword = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: color 0.2s ease;
  text-align: center;
  width: 100%;

  &:hover {
    color: #667eea;
  }
`;

const EmailVerificationNotice = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #ffc107;
  font-size: 0.9rem;
  text-align: center;
`;

// 表單數據類型
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'viewer' | 'streamer';
}

const FirebaseLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  
  // 使用 Firebase Auth Hook
  const { user, initializing, isAuthenticated } = useFirebaseAuth();
  
  // Redux 狀態
  const { loading, error } = useSelector((state: RootState) => state.firebaseAuth);

  // 表單處理
  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();
  const forgotPasswordForm = useForm<{ email: string }>();

  const navigate = useNavigate();

  // 如果已經登入，重定向到目標頁面
  useEffect(() => {
    if (isAuthenticated && user && !initializing) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, location.state, initializing, navigate]);

  // 清除錯誤訊息
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearFirebaseError());
    }
  }, [error, dispatch]);


  // 處理登入
  const handleLogin = async (data: LoginFormData) => {
    try {
      await dispatch(firebaseLogin(data) as any).unwrap();
      toast.success('登入成功！');
    } catch (error: any) {
      toast.error(error || '登入失敗');
    }
  };

  // 處理註冊
  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('密碼確認不匹配');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await dispatch(firebaseRegister(registerData) as any).unwrap();
      toast.success('註冊成功！請檢查您的電子郵件進行驗證。');
    } catch (error: any) {
      toast.error(error || '註冊失敗');
    }
  };

  // 處理忘記密碼
  const handleForgotPassword = async (data: { email: string }) => {
    try {
      await dispatch(sendFirebasePasswordReset(data.email) as any).unwrap();
      toast.success('密碼重設郵件已發送！');
      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      toast.error(error || '發送失敗');
    }
  };

  // 診斷 Firebase 連接
  const handleDiagnose = async () => {
    toast.loading('正在診斷連接...', { id: 'diagnose' });
    
    try {
      // 執行網路診斷
      const networkResult = await diagnoseNetworkIssue();
      console.log('網路診斷結果:', networkResult);
      
      // 執行 Firebase 連接測試
      const firebaseResult = await testFirebaseConnection() as any;
      console.log('Firebase 連接測試結果:', firebaseResult);
      
      if (firebaseResult.success) {
        toast.success('Firebase 連接正常！', { id: 'diagnose' });
      } else {
        toast.error(`連接失敗: ${firebaseResult.message}`, { id: 'diagnose' });
      }
    } catch (error: any) {
      console.error('診斷過程出錯:', error);
      toast.error(`診斷失敗: ${error.message}`, { id: 'diagnose' });
    }
  };

  // 如果正在初始化，顯示載入畫面
  if (initializing) {
    return <LoadingSpinner fullScreen text="初始化中..." />;
  }

  // 如果已經認證，重定向 - 已在上方 useEffect 中處理

  // 忘記密碼表單
  if (showForgotPassword) {
    return (
      <LoginContainer>
        <LoginCard>
          <LoginHeader>
            <LoginTitle>重設密碼</LoginTitle>
            <LoginSubtitle>輸入您的電子郵件地址</LoginSubtitle>
          </LoginHeader>

          <Form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}>
            <FormGroup>
              <Label>電子郵件</Label>
              <Input
                type="email"
                placeholder="請輸入電子郵件"
                hasError={!!forgotPasswordForm.formState.errors.email}
                {...forgotPasswordForm.register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的電子郵件地址'
                  }
                })}
              />
              {forgotPasswordForm.formState.errors.email && (
                <ErrorMessage>{forgotPasswordForm.formState.errors.email.message}</ErrorMessage>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : '發送重設郵件'}
            </SubmitButton>

            <ForgotPassword 
              type="button"
              onClick={() => setShowForgotPassword(false)}
            >
              返回登入
            </ForgotPassword>
          </Form>
        </LoginCard>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <LoginTitle>Streaming Overlay</LoginTitle>
          <LoginSubtitle>
            {isLogin ? '歡迎回來！請登入您的帳號' : '建立您的帳號開始使用'}
          </LoginSubtitle>
        </LoginHeader>

        <FormTabs>
          <TabButton 
            active={isLogin} 
            onClick={() => setIsLogin(true)}
            type="button"
          >
            登入
          </TabButton>
          <TabButton 
            active={!isLogin} 
            onClick={() => setIsLogin(false)}
            type="button"
          >
            註冊
          </TabButton>
        </FormTabs>

        {isLogin ? (
          <Form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <FormGroup>
              <Label>電子郵件</Label>
              <Input
                type="email"
                placeholder="請輸入電子郵件"
                hasError={!!loginForm.formState.errors.email}
                {...loginForm.register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的電子郵件地址'
                  }
                })}
              />
              {loginForm.formState.errors.email && (
                <ErrorMessage>{loginForm.formState.errors.email.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>密碼</Label>
              <Input
                type="password"
                placeholder="請輸入密碼"
                hasError={!!loginForm.formState.errors.password}
                {...loginForm.register('password', {
                  required: '請輸入密碼'
                })}
              />
              {loginForm.formState.errors.password && (
                <ErrorMessage>{loginForm.formState.errors.password.message}</ErrorMessage>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : '登入'}
            </SubmitButton>

            {/* 診斷按鈕 */}
            <SubmitButton 
              type="button" 
              onClick={handleDiagnose}
              style={{ 
                backgroundColor: '#f59e0b', 
                marginTop: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              🔍 診斷連接
            </SubmitButton>

            <ForgotPassword 
              type="button"
              onClick={() => setShowForgotPassword(true)}
            >
              忘記密碼？
            </ForgotPassword>
          </Form>
        ) : (
          <Form onSubmit={registerForm.handleSubmit(handleRegister)}>
            <FormGroup>
              <Label>用戶名</Label>
              <Input
                type="text"
                placeholder="請輸入用戶名"
                hasError={!!registerForm.formState.errors.username}
                {...registerForm.register('username', {
                  required: '請輸入用戶名',
                  minLength: { value: 3, message: '用戶名至少需要3個字符' },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: '用戶名只能包含字母、數字和下劃線'
                  }
                })}
              />
              {registerForm.formState.errors.username && (
                <ErrorMessage>{registerForm.formState.errors.username.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>電子郵件</Label>
              <Input
                type="email"
                placeholder="請輸入電子郵件"
                hasError={!!registerForm.formState.errors.email}
                {...registerForm.register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的電子郵件地址'
                  }
                })}
              />
              {registerForm.formState.errors.email && (
                <ErrorMessage>{registerForm.formState.errors.email.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>角色</Label>
              <Select
                hasError={!!registerForm.formState.errors.role}
                {...registerForm.register('role', {
                  required: '請選擇角色'
                })}
              >
                <option value="">請選擇角色</option>
                <option value="viewer">觀眾</option>
                <option value="streamer">直播主</option>
              </Select>
              {registerForm.formState.errors.role && (
                <ErrorMessage>{registerForm.formState.errors.role.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>密碼</Label>
              <Input
                type="password"
                placeholder="請輸入密碼"
                hasError={!!registerForm.formState.errors.password}
                {...registerForm.register('password', {
                  required: '請輸入密碼',
                  minLength: { value: 6, message: '密碼至少需要6個字符' }
                })}
              />
              {registerForm.formState.errors.password && (
                <ErrorMessage>{registerForm.formState.errors.password.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>確認密碼</Label>
              <Input
                type="password"
                placeholder="請再次輸入密碼"
                hasError={!!registerForm.formState.errors.confirmPassword}
                {...registerForm.register('confirmPassword', {
                  required: '請確認密碼'
                })}
              />
              {registerForm.formState.errors.confirmPassword && (
                <ErrorMessage>{registerForm.formState.errors.confirmPassword.message}</ErrorMessage>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : '註冊'}
            </SubmitButton>
          </Form>
        )}

        {user && !user.emailVerified && (
          <EmailVerificationNotice>
            ⚠️ 請檢查您的電子郵件並點擊驗證連結以完成註冊
          </EmailVerificationNotice>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default FirebaseLogin;
