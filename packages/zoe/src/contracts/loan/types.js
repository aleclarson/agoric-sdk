/**
 * @typedef {AsyncIterable<undefined>} PeriodAsyncIterable
 *
 *  The asyncIterable used for notifications that a period has passed,
 *  on which compound interest will be calculated using the
 *  interestRate.
 */

/**
 * @typedef {number} MMR
 *  The Maintenance Margin Requirement, in percent. The default is
 *  150, meaning that collateral should be worth at least 150% of the
 *  loan. If the value of the collateral drops below mmr, liquidation
 *  occurs.
 */

/**
 * @typedef {Instance} AutoswapInstance
 *   The running contract instance for an Autoswap or Multipool
 *   Autoswap installation.  The publicFacet from the Autoswap
 *   instance is used for producing an invitation to sell the
 *   collateral on liquidation.
 */

/** @typedef {number} InterestRate
 *
 *   The rate in basis points that will be multiplied with the debt on
 *   every period to compound interest.
 */

/**
 * @typedef LoanTerms
 *
 * @property {MMR} [mmr=150]
 *
 * @property {AutoswapInstance} autoswapInstance
 *
 * @property {PriceAuthority} priceAuthority
 *
 *   Used for getting the current value of collateral and setting
 *   liquidation triggers.
 *
 * @property {PeriodAsyncIterable} periodAsyncIterable
 *
 * @property {InterestRate} interestRate
 */

/**
 * @typedef LenderSeatProperty
 * @property {ZCFSeat} lenderSeat
 *
 *   The ZCFSeat representing the lender's position in the contract.
 */

/**
 * @typedef {LoanTerms & LenderSeatProperty} LoanConfigWithLender
 *
 * After the lender exercises their invitation, the lenderSeat is added to the config.
 */

/**
 * @typedef BorrowerConfigProperties
 *
 * @property {ZCFSeat} collateralSeat
 *
 *   The ZCFSeat holding the collateral in escrow after the borrower
 *   escrows it
 *
 * @property {() => Amount} getDebt
 *
 *   A function to get the current debt
 *
 * @property {PromiseKit} liquidationPromiseKit
 *
 *   PromiseKit that includes a promise that resolves to a PriceQuote
 *   when liquidation is triggered
 */

/**
 * @typedef {LoanConfigWithLender & BorrowerConfigProperties } LoanConfigWithBorrower
 *
 * The loan has a lender, a borrower, and collateral escrowed.
 */

/**
 * @callback ScheduleLiquidation
 * @param {ContractFacet} zcf
 * @param {LoanConfigWithBorrower} config
 */

/**
 * @callback MakeLendInvitation
 * @param {ContractFacet} zcf
 * @param {LoanTerms} config
 * @returns {Promise<Invitation>} lendInvitation
 */

/**
 * @callback MakeBorrowInvitation
 * @param {ContractFacet} zcf
 * @param {LoanConfigWithLender} config
 * @returns {Promise<Invitation>} borrowInvitation
 */

/**
 * @callback MakeCloseLoanInvitation
 * @param {ContractFacet} zcf
 * @param {LoanConfigWithBorrower} config
 * @returns {Promise<Invitation>} closeLoanInvitation
 */

/**
 * Allows holder to add collateral to the contract. Exits the seat
 * after adding.
 *
 * @callback MakeAddCollateralInvitation
 * @param {ContractFacet} zcf
 * @param {LoanConfigWithBorrower} config
 * @returns {Promise<Invitation>} addCollateralInvitation
 */

/**
 * @callback Liquidate
 * @param {ContractFacet} zcf
 * @param {LoanConfigWithBorrower} config
 * @returns {void}
 */

/**
 * @callback MakeDebtCalculator
 * @param {DebtCalculatorConfig} debtCalculatorConfig
 */

/**
 * @callback CalcInterestFn
 * @param {number} oldDebtValue
 * @param {number} interestRate
 * @returns {number} interest
 */

/**
 * @typedef {Object} DebtCalculatorConfig
 * @property {CalcInterestFn} calcInterestFn
 *
 *   A function to calculate the interest, given the debt value and an
 *   interest rate in basis points.
 *
 * @property {Amount} originalDebt
 *
 *   The debt at the start of the loan, in Loan brand
 *
 * @property {AmountMath} loanMath
 *
 *   AmountMath for the loan brand
 *
 * @property {PeriodAsyncIterable} periodAsyncIterable
 *
 *   Used to tell the contract when a period has occurred
 *
 * @property {number} interestRate
 *
 * @property {ContractFacet} zcf
 * @property {ConfigMinusGetDebt} configMinusGetDebt
 */

/**
 * @typedef {Object} ConfigMinusGetDebt
 * @property {ZCFSeat} collateralSeat
 * @property {PromiseRecord<any>} liquidationPromiseKit
 * @property {number} [mmr]
 * @property {InstanceHandle} autoswapInstance
 * @property {PriceAuthority} priceAuthority
 * @property {AsyncIterable<undefined>} periodAsyncIterable
 * @property {number} interestRate
 * @property {ZCFSeat} lenderSeat
 */

/**
 * @typedef {Object} BorrowFacet
 *
 * @property {() => Promise<Invitation>} makeCloseLoanInvitation
 *
 * Make an invitation to close the loan by repaying the debt
 *   (including interest).
 *
 * @property {() => Promise<Invitation>} makeAddCollateralInvitation
 *
 * Make an invitation to add collateral to protect against liquidation
 *
 * @property {() => Promise<PriceQuote>} getLiquidationPromise
 *
 * Get a promise that will resolve if liquidation occurs
 *
 * @property {() => Notifier<Amount>} getDebtNotifier
 *
 * Get a Notifier that will be updated when the current debt (an Amount with the Loan
 * Brand) changes. This will increase as interest is added.
 */
