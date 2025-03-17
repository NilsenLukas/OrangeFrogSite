import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import jwt_decode from 'jwt-decode';

export default function ProtectedRoute() {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const sessionId = sessionStorage.getItem('sessionId');

        if (!token || !sessionId) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwt_decode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime || decodedToken.sessionId !== sessionId) {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('sessionId');
                navigate('/login');
                return;
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('sessionId');
            navigate('/login');
        }
    }, [auth, navigate]);

    return null;
}
