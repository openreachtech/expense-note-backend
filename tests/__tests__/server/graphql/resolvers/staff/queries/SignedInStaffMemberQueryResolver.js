import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import SignedInStaffMemberQueryResolver from '../../../../../../../server/graphql/resolvers/staff/actual/queries/SignedInStaffMemberQueryResolver.js'

import StaffMember from '../../../../../../../sequelize/models/StaffMember.js'
import StaffMemberSecret from '../../../../../../../sequelize/models/StaffMemberSecret.js'

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
     * Both codes are `204`, the family this feature's refusals carry, on this operation's own id
     * `Q001` from server/graphql/resolver-id-hash-staff.js. The literals are pinned here because a
     * renumbered code is a silently changed contract: the frontend reads the code, not the message.
     */
    test('to be fixed value', () => {
      const expected = {
        StaffMemberNotFound: '204.Q001.001',
        StaffMemberSecretNotFound: '204.Q001.002',
      }

      const actual = SignedInStaffMemberQueryResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#get:StaffMemberSecretModel', () => {
    /*
     * The seam answers the same model whatever the instance holds, so what varies case to case is
     * the instance: each is created with a different stand-in error code, and so holds a different
     * `errorHash`.
     */
    describe('should answer the StaffMemberSecret model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q001.901',
            },
          },
          expected: StaffMemberSecret,
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.Q001.902',
            },
          },
          expected: StaffMemberSecret,
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create(factoryParams)

        const actual = resolver.StaffMemberSecretModel

        expect(actual)
          .toBe(expected) // same reference
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#findStaffMemberSecret()', () => {
    /*
     * Seeded rows from sequelize/seeders/development/20260910120002-000002-staff_member_secrets.cjs.
     * The `+` tag and the subdomain are in here on purpose: the finder matches on StaffMemberId
     * alone, so an address carrying either must come back untouched rather than be filtered out by
     * something reading the address itself.
     */
    describe('should find the current address of a seeded member of staff', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
          },
          expected: expect.objectContaining({
            id: 10120001,
            StaffMemberId: 10110001,
            email: 'haruka.arai@expense-note.example',
          }),
        },
        {
          params: {
            staffMemberId: 10110002,
          },
          expected: expect.objectContaining({
            id: 10120002,
            StaffMemberId: 10110002,
            email: 'kenji.ogawa@expense-note.example',
          }),
        },
        {
          params: {
            staffMemberId: 10110006,
          },
          expected: expect.objectContaining({
            id: 10120006,
            StaffMemberId: 10110006,
            email: 'yuuto.kirishima+notes@expense-note.example',
          }),
        },
        {
          params: {
            staffMemberId: 10110007,
          },
          expected: expect.objectContaining({
            id: 10120007,
            StaffMemberId: 10110007,
            email: 'nanami.doi@sub.expense-note.example',
          }),
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const actual = await resolver.findStaffMemberSecret(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#findStaffMemberSecret()', () => {
    /*
     * The two half-issued accounts the development seeder carries deliberately: section 4 has an
     * account issued by hand, so a member of staff holding no address row is what a partial issue
     * leaves behind.
     */
    describe('when the member of staff holds no current address', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110012,
          },
        },
        {
          params: {
            staffMemberId: 10110013,
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const actual = await resolver.findStaffMemberSecret(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The id and the name come off the member of staff, the address off the secret row. Both
     * entities are built rather than fetched: this method reads properties and touches no table.
     */
    describe('should rename the two entities into the schema shape', () => {
      const cases = [
        {
          params: {
            staffMemberAttributes: {
              id: 10110001,
              name: 'Haruka Arai',
            },
            secretAttributes: {
              id: 10120001,
              StaffMemberId: 10110001,
              email: 'haruka.arai@expense-note.example',
            },
          },
          expected: {
            staffMemberId: 10110001,
            name: 'Haruka Arai',
            email: 'haruka.arai@expense-note.example',
          },
        },
        {
          params: {
            staffMemberAttributes: {
              id: 10110007,
              name: 'Nanami Doi',
            },
            secretAttributes: {
              id: 10120007,
              StaffMemberId: 10110007,
              email: 'nanami.doi@sub.expense-note.example',
            },
          },
          expected: {
            staffMemberId: 10110007,
            name: 'Nanami Doi',
            email: 'nanami.doi@sub.expense-note.example',
          },
        },
      ]

      test.each(cases)('staffMemberAttributes.id: $params.staffMemberAttributes.id', ({
        params,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const formatResponseArgs = {
          staffMemberEntity: StaffMember.build(params.staffMemberAttributes),
          secretEntity: StaffMemberSecret.build(params.secretAttributes),
        }

        const actual = resolver.formatResponse(formatResponseArgs)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The happy path, end to end against the seeded database. The id and the name are handed in on
     * the context, as the framework hands them in from the access token; the address is read from
     * staff_member_secrets for real, so each expected address below is the seeded one and a
     * resolver answering some other member of staff would fail here rather than pass a shape-only
     * assertion.
     */
    describe('should answer with the caller and their current address', () => {
      const cases = [
        {
          params: {
            staffMemberAttributes: {
              id: 10110001,
              name: 'Haruka Arai',
            },
          },
          expected: {
            staffMemberId: 10110001,
            name: 'Haruka Arai',
            email: 'haruka.arai@expense-note.example',
          },
        },
        {
          params: {
            staffMemberAttributes: {
              id: 10110002,
              name: 'Kenji Ogawa',
            },
          },
          expected: {
            staffMemberId: 10110002,
            name: 'Kenji Ogawa',
            email: 'kenji.ogawa@expense-note.example',
          },
        },
        {
          params: {
            staffMemberAttributes: {
              id: 10110006,
              name: 'Yuuto Kirishima',
            },
          },
          expected: {
            staffMemberId: 10110006,
            name: 'Yuuto Kirishima',
            email: 'yuuto.kirishima+notes@expense-note.example',
          },
        },
        {
          params: {
            staffMemberAttributes: {
              id: 10110011,
              name: 'Sakura Umeda',
            },
          },
          expected: {
            staffMemberId: 10110011,
            name: 'Sakura Umeda',
            email: 'sakura.umeda@expense-note.example',
          },
        },
      ]

      test.each(cases)('staffMemberAttributes.id: $params.staffMemberAttributes.id', async ({
        params,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const resolveArgs = {
          context: /** @type {*} */ ({
            staffMember: StaffMember.build(params.staffMemberAttributes),
            staffMemberId: params.staffMemberAttributes.id,
          }),
        }

        const actual = await resolver.resolve(resolveArgs)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * Section 10's criterion: signedInStaffMember called without a session is refused, and returns
     * nobody.
     *
     * The engine is where that is guaranteed -- the operation is absent from
     * `schemasToSkipFiltering`, so the authentication filter refuses the call before a resolver is
     * reached. What is asserted here is the resolver's own second line, for the case where that
     * hand-maintained list is wrong: the refusal is a bare error code, and nothing about a caller
     * comes back with it.
     *
     * The two cases differ in what else the context carries, which is the point: the guard reads
     * `staffMember`, and an otherwise fully populated context must not slip past it.
     */
    describe('when the context carries no member of staff', () => {
      const cases = [
        {
          params: {
            context: {
              staffMember: null,
            },
          },
          label: 'staffMember alone',
          expected: '204.Q001.001',
        },
        {
          params: {
            context: {
              staffMember: null,
              staffMemberId: null,
              now: new Date('2026-03-02T09:00:00.000Z'),
            },
          },
          label: 'staffMember among the rest of the context',
          expected: '204.Q001.001',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const actual = () => resolver.resolve(/** @type {*} */ (params))

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignedInStaffMemberQueryResolver', () => {
  describe('#resolve()', () => {
    /*
     * The two half-issued accounts again, this time through the whole operation. `email` is
     * `String!` in the contract, so there is no null to answer with, and a blank would fill a
     * required field with something that is not an address -- the operation refuses instead, and
     * the refusal carries no address of its own.
     */
    describe('when the member of staff holds no current address', () => {
      const cases = [
        {
          params: {
            staffMemberAttributes: {
              id: 10110012,
              name: 'Tsubasa Enomoto',
            },
          },
          expected: '204.Q001.002',
        },
        {
          params: {
            staffMemberAttributes: {
              id: 10110013,
              name: 'Kaede Shirai',
            },
          },
          expected: '204.Q001.002',
        },
      ]

      test.each(cases)('staffMemberAttributes.id: $params.staffMemberAttributes.id', async ({
        params,
        expected,
      }) => {
        const resolver = SignedInStaffMemberQueryResolver.create()

        const resolveArgs = {
          context: /** @type {*} */ ({
            staffMember: StaffMember.build(params.staffMemberAttributes),
            staffMemberId: params.staffMemberAttributes.id,
          }),
        }

        const actual = () => resolver.resolve(resolveArgs)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})
