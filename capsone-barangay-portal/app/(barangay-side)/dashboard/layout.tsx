
export default function DashboardLayout({
    children,
}:{
    children: React.ReactNode
}){
    return (
        <div className="ml-32  flex bg-gray-200">
            {children}    
        </div>
    )
}