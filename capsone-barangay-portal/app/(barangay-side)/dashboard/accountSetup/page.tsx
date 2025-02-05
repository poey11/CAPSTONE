const accountSetup = () => {
    return (
        <form className="flex flex-col  justify-center">
            <label htmlFor="fName">First Name: </label>
            <input id="fName" type="text" name="fName" className="border-2 border-black" required />

            <label htmlFor="fName">Last Name: </label>
            <input id="fName" type="text" name="fName" className="border-2 border-black" required />

            <label htmlFor="bday">Birth date: </label>
            <input id="fName" type="text" name="phone" className="border-2 border-black" required />

            <label htmlFor="address">Address: </label>
            <input id="fName" type="text" name="address" className="border-2 border-black" required />

            <label htmlFor="phone">Cellphone / Telephone #: </label>
            <input id="fName" type="text" name="phone" className="border-2 border-black" required />
        
            <button   className="bg-blue-500 mt-3 text-white">Submit</button>
        </form>
    );
}
 
export default accountSetup;