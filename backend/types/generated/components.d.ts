import type { Schema, Struct } from '@strapi/strapi';

export interface SchemaStructuredData extends Struct.ComponentSchema {
  collectionName: 'components_schema_structured_data';
  info: {
    description: 'Donn\u00E9es structur\u00E9es JSON-LD pour le r\u00E9f\u00E9rencement';
    displayName: 'Structured Data';
    icon: 'code';
  };
  attributes: {
    dateModified: Schema.Attribute.DateTime;
    datePublished: Schema.Attribute.DateTime;
    headline: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 110;
      }>;
    type: Schema.Attribute.Enumeration<
      ['Article', 'BlogPosting', 'NewsArticle']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Article'>;
    wordCount: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface SeoSeoData extends Struct.ComponentSchema {
  collectionName: 'components_seo_seo_data';
  info: {
    description: 'Composant SEO r\u00E9utilisable pour optimiser le r\u00E9f\u00E9rencement';
    displayName: 'SEO Data';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 155;
        minLength: 50;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
        minLength: 10;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
    preventIndexing: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    twitterImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'schema.structured-data': SchemaStructuredData;
      'seo.seo-data': SeoSeoData;
    }
  }
}
