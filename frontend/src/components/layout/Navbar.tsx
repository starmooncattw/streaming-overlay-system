import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '../../store/store';
import { firebaseLogout } from '../../store/slices/firebaseAuthSlice';
import useFirebaseAuth from '../../hooks/useFirebaseAuth';

// 樣式組件
const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 1000;
`;

const NavbarBrand = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavbarMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavbarLink = styled(Link)`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: #667eea;
  }

  &.active {
    color: #667eea;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
`;

const UserAvatar = styled.div<{ src?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.src ? `url(${props.src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
`;

const UserName = styled.span`
  color: #ffffff;
  font-weight: 500;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem 0;
  min-width: 200px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #667eea;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'offline' | 'streaming' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'online': return '#10b981';
      case 'streaming': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  position: absolute;
  bottom: 2px;
  right: 2px;
  border: 2px solid rgba(15, 15, 35, 0.95);
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, profile, isAuthenticated } = useFirebaseAuth();
  const { loading } = useSelector((state: RootState) => state.firebaseAuth);

  // 處理登出
  const handleLogout = async () => {
    try {
      await dispatch(firebaseLogout() as any).unwrap();
      navigate('/login');
      setDropdownOpen(false);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 獲取用戶狀態
  const getUserStatus = (): 'online' | 'offline' | 'streaming' => {
    if (!isAuthenticated) return 'offline';
    // 這裡可以根據實際的直播狀態來判斷
    return 'online';
  };

  // 獲取用戶名稱的首字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 導航連結
  const getNavLinks = () => {
    if (!isAuthenticated || !profile) return [];

    const commonLinks = [
      { to: '/dashboard', label: '儀表板' }
    ];

    const streamerLinks = [
      { to: '/stream', label: '直播管理' },
      { to: '/overlay', label: '疊加層' },
      { to: '/donations', label: '捐款' }
    ];

    const adminLinks = [
      { to: '/admin', label: '系統管理' },
      { to: '/analytics', label: '分析' }
    ];

    switch (profile.role) {
      case 'admin':
        return [...commonLinks, ...streamerLinks, ...adminLinks];
      case 'streamer':
        return [...commonLinks, ...streamerLinks];
      default:
        return commonLinks;
    }
  };

  if (!isAuthenticated || !user || !profile) {
    return (
      <NavbarContainer>
        <NavbarBrand to="/">
          🎥 Streaming Overlay
        </NavbarBrand>
        <div>
          <NavbarLink to="/login">登入</NavbarLink>
        </div>
      </NavbarContainer>
    );
  }

  return (
    <NavbarContainer>
      <NavbarBrand to="/dashboard">
        🎥 Streaming Overlay
      </NavbarBrand>

      <NavbarMenu>
        {getNavLinks().map((link, index) => (
          <NavbarLink key={index} to={link.to}>
            {link.label}
          </NavbarLink>
        ))}
      </NavbarMenu>

      <UserSection>
        <UserName>{profile.displayName}</UserName>
        <div style={{ position: 'relative' }}>
          <UserAvatar
            src={profile.avatar}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {!profile.avatar && getInitials(profile.displayName)}
            <StatusIndicator status={getUserStatus()} />
          </UserAvatar>

          <DropdownMenu isOpen={dropdownOpen}>
            <DropdownItem onClick={() => {
              navigate('/profile');
              setDropdownOpen(false);
            }}>
              👤 個人資料
            </DropdownItem>
            
            <DropdownItem onClick={() => {
              navigate('/settings');
              setDropdownOpen(false);
            }}>
              ⚙️ 設定
            </DropdownItem>

            {profile.role === 'streamer' && (
              <DropdownItem onClick={() => {
                navigate('/stream');
                setDropdownOpen(false);
              }}>
                🎥 直播控制台
              </DropdownItem>
            )}

            {profile.role === 'admin' && (
              <DropdownItem onClick={() => {
                navigate('/admin');
                setDropdownOpen(false);
              }}>
                🛠️ 管理後台
              </DropdownItem>
            )}

            <DropdownDivider />

            <DropdownItem onClick={() => {
              navigate('/help');
              setDropdownOpen(false);
            }}>
              ❓ 幫助中心
            </DropdownItem>

            <DropdownItem onClick={handleLogout} disabled={loading}>
              {loading ? '登出中...' : '🚪 登出'}
            </DropdownItem>
          </DropdownMenu>
        </div>

        <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </MobileMenuButton>
      </UserSection>

      {/* 點擊外部關閉下拉選單 */}
      {dropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1
          }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </NavbarContainer>
  );
};

export default Navbar;
