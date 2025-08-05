const signup = async (req, res)=>{
    res.json({
        data: "Hit sign up api"
    })
}

const login = async (req, res)=>{
    res.json({
        data: "Hit login api"
    })
}

const logout = async (req, res)=>{
    res.json({
        data: "Hit logout api"
    })
}

export {signup, login, logout}