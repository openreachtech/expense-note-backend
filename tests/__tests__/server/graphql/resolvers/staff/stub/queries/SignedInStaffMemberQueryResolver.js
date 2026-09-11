import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import SignedInStaffMemberQueryResolver from '../../../../../../../../server/graphql/resolvers/staff/stub/queries/SignedInStaffMemberQueryResolver.js'

describe('SignedInStaffMemberQueryResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseQueryResolver', () => {
      const actual = SignedInStaffMemberQueryResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseQueryResolver)
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'signedInStaffMember'

      const actual = SignedInStaffMemberQueryResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * A stub throws nothing, so it owns no error code. The real codes, built on this operation's
     * id `Q001`, arrive with the `actual/` resolver at checkpoint 6 — as does the refusal without
     * a session, which no stub can stand in for.
     */
    test('to be empty', () => {
      const expected = {}

      const actual = SignedInStaffMemberQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The operation takes no argument, so what varies case to case is the instance: each is
     * created with a different stand-in error code, and so holds a different `errorHash`. The
     * member of staff answered does not move with it, and is the same one
     * `SignInMutationResolver` returns — same id, same name, same address.
     */
    describe('to answer with the same hardcoded staff member whatever the instance holds', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '203.Q001.001',
            },
          },
          expected: {
            staffMemberId: 9001,
            name: 'Stub Member Of Staff',
            email: 'stub-member-of-staff@example.invalid',
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q001.001',
            },
          },
          expected: {
            staffMemberId: 9001,
            name: 'Stub Member Of Staff',
            email: 'stub-member-of-staff@example.invalid',
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', async ({
        factoryParams,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create(factoryParams)

        const actual = await resolver.resolve()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
