import Ember from 'ember';
import { test } from 'ember-qunit';
import '../../helpers/define-fixture';
import testHelper from '../../test-helper';
import 'ember-feature-flags/tests/helpers/with-feature';

const unusedAdvisor = {
  id: 1,
  termsSentAt: '2015-02-18T10:00:00.000+00:00',
  projectId: 1,

  advisor: {
    name: 'IceFrog',
    id: 1,
    email: 'icefrog@gmail.com',
    timeZone: null,
    jobTitle: 'God',
    companyName: 'Valve, Inc.',
    phoneNumbers: [],
    phones: []
  }
};

QUnit.module("Unused Advisors Follow Up", {
  beforeEach: function() {
    testHelper.beforeEach.apply(this, arguments);

    Timecop.install();
    Timecop.freeze(moment(unusedAdvisor.termsSentAt));

    defineFixture('GET', '/email_templates', {
      params: { purpose: 'Unused Advisor' },

      response: {
        "email_templates": [{
          "id": "1",
          "name": "Example Template",
          "body": "Really good template.",
          "subject": "Example Subject",
          "purpose": "Unused Advisor"
        }]
      }
    });

    defineFixture('GET', '/email_variables', {
      params: {
        concerning_id: unusedAdvisor.id.toString(),
        concerning_type: 'email/unused_advisorship_email'
      },

      response: {
        "email_variables": [{
          "id": `email/unused_advisorship_email_${unusedAdvisor.id}_your_first_name`,
          "key": "your_first_name",
          "value": "SingSing"
        }]
      }
    });

    defineFixture('GET', '/unused_advisors', { response: {
      "unused_advisors": [
        {
          "id": unusedAdvisor.id,
          "name": unusedAdvisor.advisor.name,
          "terms_sent_at": unusedAdvisor.termsSentAt,
          "project_id": unusedAdvisor.projectId,
          "advisor_id": unusedAdvisor.advisor.id
        }
      ],

      "projects": [
        {
          "id": "1",
          "name": "Project Name",
          "codename": "Internal Project title"
        }
      ],

      "advisors": [
        {
          "id": unusedAdvisor.advisor.id,
          "avatar_url": EmberENV.blankAvatarUrl,
          "name": unusedAdvisor.advisor.name,
          "time_zone": unusedAdvisor.advisor.timeZone,
          "emails": [unusedAdvisor.advisor.email],
          "job_title": unusedAdvisor.advisor.jobTitle,
          "company_name": unusedAdvisor.advisor.companyName,
          "phone_numbers": unusedAdvisor.advisor.phoneNumbers,
          "phones": unusedAdvisor.advisor.phones
        }
      ]
    }});

    defineFixture('GET', '/project_history', {
      params: {
        advisor_id: unusedAdvisor.advisor.id.toString()
      },

      response: {
        "project_history": []
      }
    });

    defineFixture('GET', '/emails', {
      params: {
        emails: unusedAdvisor.advisor.email,
        page: '1',
        per_page: '10'
      },

      response: {
        'emails': []
      }
    });
  },

  afterEach: function() {
    testHelper.afterEach.apply(this, arguments);
    Timecop.uninstall();
  }
});

test("Send follow up email", function(assert) {
  var postHandler = defineFixture('POST', '/email_deliveries', {
    request: {
      "email_delivery": {
        "subject": `Hello ${unusedAdvisor.advisor.name}`,
        "body": "Giff Ember buff plox, {{your_first_name}}",
        "recipients": unusedAdvisor.advisor.email,
        "from": "example@user.com",
        "cc": "arteezy@secret.com",
        "bcc": "kuroky@secret.com",
        "concerning_id": unusedAdvisor.id,
        "concerning_type": "email/unused_advisorship_email"
      }
    },

    response: {}
  });

  var deleteHandler = defineFixture('DELETE', `/unused_advisors/${unusedAdvisor.id}`);

  visit(`/dashboard/unused_advisors/${unusedAdvisor.id}`);

  click("button:contains('Follow Up')");
  fillIn('.email-composer textarea', 'Giff Ember buff plox, {{your_first_name}}');
  click("a:contains('Change Settings')");
  fillIn('input[name=subject]', 'Hello IceFrog');
  fillIn('input[name=cc]', 'arteezy@secret.com');
  fillIn('input[name=bcc]', 'kuroky@secret.com');
  click("a:contains('Save Settings')");
  click("button:contains('Send')");

  andThen(function() {
    assert.equal(postHandler.called, true);
    assert.equal(deleteHandler.called, true);
    var emailDeliveryMessage = $('.messenger .messenger-message-inner').last().text().trim();
    var advisorRemovalMessage = $('.messenger .messenger-message-inner').first().text().trim();
    assert.equal(emailDeliveryMessage, 'Your email has been sent.');
    assert.equal(advisorRemovalMessage, 'The advisor IceFrog has been removed from the list.');
  });
});

test("Send follow up email using a template", function(assert) {
  var postHandler = defineFixture('POST', '/email_deliveries', {
    request: {
      "email_delivery": {
        "subject": "Example Subject",
        "body": "Really good template.",
        "recipients": "ppd@salty.com",
        "from": "some@user.com",
        "cc": "arteezy@secret.com",
        "bcc": "kuroky@secret.com",
        "concerning_id": unusedAdvisor.id,
        "concerning_type": "email/unused_advisorship_email"
      }
    },

    response: {}
  });

  var deleteHandler = defineFixture('DELETE', `/unused_advisors/${unusedAdvisor.id}`);

  visit(`/dashboard/unused_advisors/${unusedAdvisor.id}`);

  click("button:contains('Follow Up')");
  fillIn('.email-composer textarea', 'Giff Ember buff plox, {{your_first_name}}');
  click("a:contains('Change Settings')");
  fillIn('input[name=subject]', 'Hello IceFrog');
  fillIn('input[name=recipients]', 'ppd@salty.com');
  fillIn('input[name=from]', 'some@user.com');
  fillIn('input[name=cc]', 'arteezy@secret.com');
  fillIn('input[name=bcc]', 'kuroky@secret.com');
  select('select[name=template]', 'Example Template');
  click("a:contains('Save Settings')");
  click("button:contains('Send')");

  andThen(function() {
    var emailDeliveryMessage = $('.messenger .messenger-message-inner').last().text().trim();
    var advisorRemovalMessage = $('.messenger .messenger-message-inner').first().text().trim();

    assert.equal(postHandler.called, true);
    assert.equal(deleteHandler.called, true);
    assert.equal(find('.email-composer .alert').length, 0);
    assert.equal(emailDeliveryMessage, 'Your email has been sent.');
    assert.equal(advisorRemovalMessage, 'The advisor IceFrog was removed from the list.');
  });
});

test("Preview follow up email", function(assert) {
  visit(`/dashboard/unused_advisors/${unusedAdvisor.id}`);

  click("button:contains('Follow Up')");
  fillIn('.email-composer textarea', 'Giff Ember buff plox, {{your_first_name}}');
  click("button:contains('Preview')");

  andThen(function() {
    assert.equal(find('.email-composer textarea:visible').length, 0);
    assert.equal(find('.preview pre').text().trim(), 'Giff Ember buff plox, SingSing');
  });
});

test("Follow up email variables validation", function(assert) {
  visit(`/dashboard/unused_advisors/${unusedAdvisor.id}`);

  click("button:contains('Follow Up')");
  fillIn('.email-composer textarea', 'Giff Ember buff plox, {{motto}}');

  andThen(function() {
    assert.equal(find('.email-composer .alert').text().trim(), "{{motto}} is not a valid placeholder.");
  });
});
