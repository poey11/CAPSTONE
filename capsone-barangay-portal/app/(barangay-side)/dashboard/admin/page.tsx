

const admin = () => {
    return (  
        <div>
            <h1>Admin Module</h1>
            <h2>Resident Users Table</h2>
            <h2>Barangay Users Table</h2>
            <form className=" flex flex-col  justify-center">
                <label htmlFor="username">User ID: </label>
                <input type="text"  id="username"  className="border-2 border-black" disabled />
                <button  className="bg-blue-500 text-white">Generate User ID</button>
                <label htmlFor="password">Password: </label>
                <input type="password" id="password"  className="border-2 border-black"  placeholder=""/>
                <button type="submit" className="bg-blue-500 text-white">Create New Barangay User</button>

            </form>
        </div>

    );
}
 
export default admin;