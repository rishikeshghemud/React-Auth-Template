import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole
}) => {

    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while auth is being checked
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Only redirect to login if we're sure the user is not authenticated
    // and auth check is complete (loading = false)
    if (!isAuthenticated && !loading) {
        console.log('🚫 ProtectedRoute: User not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace/>
    }

    // User is authenticated, render children
    return <>{children}</>
}
