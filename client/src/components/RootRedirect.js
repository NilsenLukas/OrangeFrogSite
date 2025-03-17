import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import jwt_decode from 'jwt-decode';

const RootRedirect = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwt_decode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                localStorage.removeItem('authToken');
                navigate('/login');
                return;
            }

            if (auth.isAuthenticated) {
                navigate(decodedToken.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
            }

        } catch (error) {
            localStorage.removeItem('authToken');
            navigate('/login');
        }
    }, [auth, navigate]);

    return null;
};

export default RootRedirect;
