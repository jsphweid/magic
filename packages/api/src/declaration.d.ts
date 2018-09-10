// twilio's built-in types are totally broken for twiml.MessagingResponse
declare module "twilio" {
  const twiml: any;
  export { twiml };
}
