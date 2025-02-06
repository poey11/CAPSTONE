import { cookies } from 'next/headers';
import Form from "@/app/(barangay-side)/components/accSetupForm";

const accountSetup = async() => {
    const Cookies = await cookies();
    const barangayToken = Cookies.get('barangayToken');

    return (
        <>
            <Form cookies={barangayToken?.value}/>
        </>
    );
}
 
export default accountSetup;