const dotenv = require('dotenv')

dotenv.config();

const simpleCheck = (headers, body)=>{
    const listId = process.env.listId;
    const userAgents = ['MailChimp', 'MailChimp.com WebHook Validator', 'MailChimpToZephr Test']
    return (body.data.list_id === listId &&  userAgents.includes(headers["user-agent"]) )
}

export { simpleCheck }