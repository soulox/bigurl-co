import AuthorizeNet from 'authorizenet';
const { APIContracts, APIControllers } = AuthorizeNet;

const API_LOGIN_ID = process.env.AUTHORIZENET_API_LOGIN_ID || '';
const TRANSACTION_KEY = process.env.AUTHORIZENET_TRANSACTION_KEY || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export interface PaymentRequest {
  amount: number;
  cardNumber: string;
  expirationDate: string; // MM/YY
  cvv: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  authCode?: string;
  message?: string;
  errors?: string[];
}

export function processPayment(payment: PaymentRequest): Promise<PaymentResponse> {
  return new Promise((resolve) => {
    // Set merchant authentication
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(TRANSACTION_KEY);

    // Set credit card information
    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(payment.cardNumber);
    creditCard.setExpirationDate(payment.expirationDate);
    creditCard.setCardCode(payment.cvv);

    // Set payment details
    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    // Set billing address
    const billTo = new APIContracts.CustomerAddressType();
    billTo.setFirstName(payment.firstName);
    billTo.setLastName(payment.lastName);
    billTo.setEmail(payment.email);
    if (payment.address) billTo.setAddress(payment.address);
    if (payment.city) billTo.setCity(payment.city);
    if (payment.state) billTo.setState(payment.state);
    if (payment.zip) billTo.setZip(payment.zip);
    if (payment.country) billTo.setCountry(payment.country);

    // Create transaction request
    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(payment.amount);
    transactionRequestType.setBillTo(billTo);

    // Create the API request
    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    // Execute the API call
    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    // Set endpoint
    if (IS_PRODUCTION) {
      ctrl.setEnvironment(APIControllers.SDKConstants.endpoint.production);
    } else {
      ctrl.setEnvironment(APIControllers.SDKConstants.endpoint.sandbox);
    }

    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const response = new APIContracts.CreateTransactionResponse(apiResponse);

      if (response !== null) {
        if (response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
          const transResponse = response.getTransactionResponse();
          
          if (transResponse && transResponse.getMessages() !== null) {
            resolve({
              success: true,
              transactionId: transResponse.getTransId(),
              authCode: transResponse.getAuthCode(),
              message: transResponse.getMessages().getMessage()[0].getDescription(),
            });
          } else {
            const errors = transResponse && transResponse.getErrors() !== null
              ? transResponse.getErrors()!.getError().map((e: any) => `${e.getErrorCode()}: ${e.getErrorText()}`)
              : ['Transaction failed'];

            resolve({
              success: false,
              errors,
            });
          }
        } else {
          const errors = response.getTransactionResponse()?.getErrors()?.getError()?.map((e: any) => 
            `${e.getErrorCode()}: ${e.getErrorText()}`
          ) || response.getMessages().getMessage().map((m: any) => 
            `${m.getCode()}: ${m.getText()}`
          );

          resolve({
            success: false,
            errors,
          });
        }
      } else {
        resolve({
          success: false,
          errors: ['No response from payment gateway'],
        });
      }
    });
  });
}

export function createSubscription(
  amount: number,
  interval: 'monthly' | 'yearly',
  payment: PaymentRequest
): Promise<PaymentResponse> {
  return new Promise((resolve) => {
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(TRANSACTION_KEY);

    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(payment.cardNumber);
    creditCard.setExpirationDate(payment.expirationDate);
    creditCard.setCardCode(payment.cvv);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    const paymentScheduleType = new APIContracts.PaymentScheduleType();
    const paymentScheduleTypeInterval = new APIContracts.PaymentScheduleTypeInterval();
    paymentScheduleTypeInterval.setLength(1);
    paymentScheduleTypeInterval.setUnit(
      interval === 'monthly' 
        ? APIContracts.ARBSubscriptionUnitEnum.MONTHS 
        : APIContracts.ARBSubscriptionUnitEnum.YEARS
    );
    paymentScheduleType.setInterval(paymentScheduleTypeInterval);
    paymentScheduleType.setStartDate(new Date().toISOString().split('T')[0]);
    paymentScheduleType.setTotalOccurrences(9999);

    const billTo = new APIContracts.CustomerAddressType();
    billTo.setFirstName(payment.firstName);
    billTo.setLastName(payment.lastName);
    billTo.setEmail(payment.email);

    const subscriptionType = new APIContracts.ARBSubscriptionType();
    subscriptionType.setName(`BigURL - ${amount}/month`);
    subscriptionType.setPaymentSchedule(paymentScheduleType);
    subscriptionType.setAmount(amount);
    subscriptionType.setPayment(paymentType);
    subscriptionType.setBillTo(billTo);

    const request = new APIContracts.ARBCreateSubscriptionRequest();
    request.setMerchantAuthentication(merchantAuthenticationType);
    request.setSubscription(subscriptionType);

    const ctrl = new APIControllers.ARBCreateSubscriptionController(request.getJSON());

    if (IS_PRODUCTION) {
      ctrl.setEnvironment(APIControllers.SDKConstants.endpoint.production);
    } else {
      ctrl.setEnvironment(APIControllers.SDKConstants.endpoint.sandbox);
    }

    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const response = new APIContracts.ARBCreateSubscriptionResponse(apiResponse);

      if (response !== null) {
        if (response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
          resolve({
            success: true,
            transactionId: response.getSubscriptionId(),
            message: 'Subscription created successfully',
          });
        } else {
          const errors = response.getMessages().getMessage().map((m: any) => 
            `${m.getCode()}: ${m.getText()}`
          );
          resolve({
            success: false,
            errors,
          });
        }
      } else {
        resolve({
          success: false,
          errors: ['No response from payment gateway'],
        });
      }
    });
  });
}

