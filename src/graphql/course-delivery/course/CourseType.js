import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import { resolveDate } from '@lib/resolvers';
import SectionType from '../section/SectionType';
import UserType from '../../user/UserType';

export default _.Object({
  name: 'CourseDeliveryInstance',
  fields: {

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    creatorId: { type: _.NonNull(_.Int) },
    price: { type: _.Float },
    creationDate: {
      type: _.NonNull(_.String),
      resolve: ({ creationDate }) => resolveDate(creationDate)
    },
    startDate: {
      type: _.String,
      resolve: ({ startDate }) => resolveDate(startDate)
    },
    enrollmentEndDate: {
      type: _.String,
      resolve: ({ enrollmentEndDate }) => resolveDate(enrollmentEndDate)
    },

    description: {
      type: _.JSON,
      resolve: ({ description }) => resolveJSON(description)
    },
    picture: {
      type: _.JSON,
      resolve: ({ picture }) => resolveJSON(picture)
    },
    enrolled: { type: _.Boolean },

    sections: {
      type: _.List(_.NonNull(SectionType)),
      async resolve({ id }, {}, { loaders }, { fields }) {
        const sections = await loaders.courseDelivery_section_byCourseId.load(id, fields);
        // const _units = [];
        // const nowDate = new Date();
        // for (const { subsections } of sections) {
        //   if (subsections) for (const { units, accessDate, expirationDate } of subsections) {
        //     const available = (accessDate ? accessDate <= nowDate : true) && (expirationDate ? expirationDate >= nowDate : true);
        //     if (units && available) for (const unit of units)
        //     _units.push(unit);
        //   }
        // }
        // const unitsLastIndex = _units.length - 1;
        // for (let index = 0; index <= unitsLastIndex; index++) {
        //   const unit = _units[index];
        //   if (index !== 0) unit.prevousUnitId = _units[index - 1].id;
        //   if (index !== unitsLastIndex) unit.nextUnitId = _units[index + 1].id;
        // }
        // const _subsections = [];
        // const nowDate = new Date();
        // for (const { subsections } of sections) {
        //   if (subsections) for (const subsection of subsections) {
        //     if (subsection) {
        //       const { accessDate, expirationDate } = subsection;
        //       const available = (accessDate ? accessDate <= nowDate : true) && (expirationDate ? expirationDate >= nowDate : true);
        //       if (available) _subsections.push(subsection);
        //     }
        //   }
        // }
        // const lastIndex = _subsections.length - 1;
        // for (let index = 0; index <= lastIndex; index++) {
        //   const unit = _subsections[index];
        //   if (index !== 0) unit.prevousSubsectionId = _subsections[index - 1].id;
        //   if (index !== lastIndex) unit.nextSubsectionId = _subsections[index + 1].id;
        // }
        return sections;
      }
    } |> upgradeResolveFn,
    instructors: {
      type: _.List(UserType),
      resolve({ instructors }, {}, { loaders }, { fields }) {
        if (!instructors) return null;
        return loaders.user_byId.loadMany(JSON.parse(instructors), fields);
      }
    } |> upgradeResolveFn,

    isAwaitPurchaseComplition: { type: _.Boolean },

    data: {
      type: _.JSON,
      resolve: ({ data }) => resolveJSON(data)
    }

  }
});