import harden from '@agoric/harden';

import makePromise from '../../../util/makePromise';

const makeContract = harden(zoe => {
  const isValidOffer = (
    extentOps,
    offerIds,
    offerIdsToOfferDescs,
    offerMadeDesc,
  ) => {
    const makeHasOkRules = validRules => offer =>
      validRules.every((rule, i) => rule === offer[i].rule, true);

    const ruleEqual = (leftRule, rightRule) => leftRule.rule === rightRule.rule;

    const extentEqual = (extentOp, leftRule, rightRule) =>
      extentOp.equals(leftRule.assetDesc.extent, rightRule.assetDesc.extent);

    const assayEqual = (leftRule, rightRule) =>
      leftRule.assetDesc.label.assay === rightRule.assetDesc.label.assay;

    const makeSecondOffer = firstOffer =>
      harden([
        {
          rule: firstOffer[1].rule,
          assetDesc: firstOffer[0].assetDesc,
        },
        {
          rule: firstOffer[0].rule,
          assetDesc: firstOffer[1].assetDesc,
        },
      ]);

    // Check that two offers are equal in both their rules and their assetDescs
    const offerEqual = (leftOffer, rightOffer) => {
      const isLengthEqual = leftOffer.length === rightOffer.length;
      if (!isLengthEqual) {
        return false;
      }
      return leftOffer.every(
        (leftRule, i) =>
          ruleEqual(leftRule, rightOffer[i]) &&
          assayEqual(leftRule, rightOffer[i]) &&
          extentEqual(extentOps[i], leftRule, rightOffer[i]),
        true,
      );
    };

    const isFirstOffer = offerIds.length === 0;
    const isSecondOffer = offerIds.length === 1;
    const hasOkRulesOfferFirst = makeHasOkRules([
      'offerExactly',
      'wantExactly',
    ]);
    const hasOkRulesWantFirst = makeHasOkRules(['wantExactly', 'offerExactly']);
    const isValidFirstOfferDesc = newOfferDesc =>
      hasOkRulesOfferFirst(newOfferDesc) || hasOkRulesWantFirst(newOfferDesc);
    const isValidSecondOfferDesc = (firstOffer, newOfferDesc) =>
      offerEqual(makeSecondOffer(firstOffer), newOfferDesc);
    return (
      (isFirstOffer && isValidFirstOfferDesc(offerMadeDesc)) ||
      (isSecondOffer &&
        isValidSecondOfferDesc(
          offerIdsToOfferDescs.get(offerIds[0]),
          offerMadeDesc,
        ))
    );
  };

  const canReallocate = (offerIds, _offerIdsToOfferDescs) =>
    offerIds.length === 2;
  const reallocate = (
    _extentOps,
    offerIds,
    _offerIdsToOfferDescs,
    getExtentsFor,
  ) =>
    harden({
      reallocOfferIds: offerIds,
      reallocExtents: harden([
        ...getExtentsFor(harden([offerIds[1]])),
        ...getExtentsFor(harden([offerIds[0]])),
      ]),
    });

  const offerIdsToOfferDescs = new WeakMap();
  const offerIds = [];

  return harden({
    makeOffer: async escrowReceipt => {
      const { id, offerMade: offerMadeDesc } = await zoe.burnEscrowReceipt(
        escrowReceipt,
      );

      const status = makePromise();

      // Eject if the offer is invalid
      if (
        !isValidOffer(
          zoe.getExtentOps(),
          offerIds,
          offerIdsToOfferDescs,
          offerMadeDesc,
        )
      ) {
        zoe.complete(harden([id]));
        status.rej('The offer was invalid. Please check your refund.');
        return status.p;
      }

      // Save the offer.
      offerIdsToOfferDescs.set(id, offerMadeDesc);
      offerIds.push(id);

      // Check if we can reallocate and reallocate.
      if (canReallocate(offerIds, offerIdsToOfferDescs)) {
        const { reallocOfferIds, reallocExtents } = reallocate(
          zoe.getExtentOps(),
          offerIds,
          offerIdsToOfferDescs,
          zoe.getExtentsFor,
        );
        zoe.reallocate(reallocOfferIds, reallocExtents);
        zoe.complete(offerIds);
      }

      status.res(
        'The offer has been accepted. Once the contract has been completed, please check your winnings',
      );
      return status.p;
    },
  });
});

const publicSwapSrcs = harden({
  makeContract: `${makeContract}`,
});

export { publicSwapSrcs };