import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(
                'http://localhost:5000/api/auth/login',
                { username, password },
                { withCredentials: true }
            );
            setAuth(data.accessToken, data.user);
            toast.success('Login successful!');
            navigate('/dashboard', { replace: true });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
                <div className="max-w-md space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Building2 className="h-9 w-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Real Estate</h1>
                            <p className="text-gray-400 text-lg">Admin Platform</p>
                        </div>
                    </div>

                    <p className="text-xl text-gray-300 leading-relaxed">
                        Manage your properties, projects, and sales from one unified dashboard.
                    </p>

                    <div className="space-y-4 pt-2">
                        {[
                            'Complete Plot Lifecycle Management',
                            'Real-time Sales & Revenue Tracking',
                            'Multi-Company Tenant Support',
                            'Role-Based Access Control',
                        ].map((feat) => (
                            <div key={feat} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                <span className="text-gray-200">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right login form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <div className="lg:hidden flex justify-center mb-4">
                            <Building2 className="h-10 w-10 text-black" />
                        </div>
                        <h2 className="text-3xl font-bold text-black">Welcome Back</h2>
                        <p className="text-gray-500">Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-black font-medium">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 h-11"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-black font-medium">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 h-11"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800 h-11 font-semibold text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-400">
                        Default: <strong className="text-gray-600">superadmin</strong> / <strong className="text-gray-600">admin123</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
