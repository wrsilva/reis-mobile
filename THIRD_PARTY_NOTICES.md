# Third-Party Notices

reis-mobile is distributed under the MIT License (see [LICENSE](LICENSE)). The skills listed below were derived from third-party projects and remain under their original licenses. Each of these skills declares `source` and `license` in its `SKILL.md` frontmatter.

Changes made by reis-mobile: every third-party skill was moved into a reis-mobile skill (`mobile-test`, `mobile-firebase`, `mobile-code-review`, `mobile-debug`, `mobile-security`, `mobile-architecture`, `mobile-flutter`, `mobile-android`). Its instructions are unchanged apart from a leading attribution line and the removed frontmatter; skills that shipped extra files (references, scripts, examples) moved as whole folders with the instructions in `GUIDE.md`, so their relative links still work. Each section lists the upstream skill and the file that holds it now. Some copies correspond to earlier revisions of the upstream files.

## evanca/flutter-ai-rules

- Source: https://github.com/evanca/flutter-ai-rules
- License: MIT
- Skills (0): none as standalone skills; all of its content lives in the files listed below
- Adapted into reis-mobile skills (upstream skill → file under `skills/`): `flutter-app-architecture` → `mobile-architecture/references/flutter/app-architecture.md`, `bloc` → `mobile-architecture/references/flutter/bloc.md`, `flutter-change-notifier` → `mobile-architecture/references/flutter/change-notifier.md`, `architecture-feature-first` → `mobile-architecture/references/flutter/feature-first.md`, `provider` → `mobile-architecture/references/flutter/provider.md`, `riverpod` → `mobile-architecture/references/flutter/riverpod.md`, `code-review` → `mobile-code-review/references/flutter/pr-review.md`, `flutter-errors` → `mobile-debug/references/flutter/errors.md`, `firebase-ai` → `mobile-firebase/references/flutter/ai-logic.md`, `firebase-analytics` → `mobile-firebase/references/flutter/analytics.md`, `firebase-app-check` → `mobile-firebase/references/flutter/app-check.md`, `firebase-auth` → `mobile-firebase/references/flutter/auth.md`, `firebase-crashlytics` → `mobile-firebase/references/flutter/crashlytics.md`, `firebase-cloud-firestore` → `mobile-firebase/references/flutter/firestore.md`, `firebase-cloud-functions` → `mobile-firebase/references/flutter/functions.md`, `firebase-in-app-messaging` → `mobile-firebase/references/flutter/in-app-messaging.md`, `firebase-messaging` → `mobile-firebase/references/flutter/messaging.md`, `firebase-database` → `mobile-firebase/references/flutter/realtime-database.md`, `firebase-remote-config` → `mobile-firebase/references/flutter/remote-config.md`, `flutterfire-configure` → `mobile-firebase/references/flutter/setup-flutterfire.md`, `firebase-data-connect` → `mobile-firebase/references/flutter/sql-connect.md`, `firebase-storage` → `mobile-firebase/references/flutter/storage.md`, `dart-3-updates` → `mobile-flutter/references/dart/dart-3.md`, `effective-dart` → `mobile-flutter/references/dart/effective-dart.md`, `mockito` → `mobile-test/references/flutter/mockito.md`, `mocktail` → `mobile-test/references/flutter/mocktail.md`, `patrol-e2e-testing` → `mobile-test/references/flutter/patrol.md`, `testing` → `mobile-test/references/flutter/testing-guidelines.md`

```text
MIT License

Copyright (c) 2025 Ivanna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## dart-lang/skills

- Source: https://github.com/dart-lang/skills
- License: BSD-3-Clause
- Skills (0): none as standalone skills; all of its content lives in the files listed below
- Adapted into reis-mobile skills (upstream skill → file under `skills/`): `dart-run-static-analysis` → `mobile-code-review/references/flutter/static-analysis.md`, `dart-resolve-package-conflicts` → `mobile-debug/references/flutter/package-conflicts.md`, `dart-fix-runtime-errors` → `mobile-debug/references/flutter/runtime-errors.md`, `dart-use-pattern-matching` → `mobile-flutter/references/dart/pattern-matching/GUIDE.md`, `dart-collect-coverage` → `mobile-test/references/flutter/coverage.md`, `dart-generate-test-mocks` → `mobile-test/references/flutter/generate-mocks.md`, `dart-migrate-to-checks-package` → `mobile-test/references/flutter/migrate-to-checks.md`, `dart-add-unit-test` → `mobile-test/references/flutter/unit-tests.md`

```text
Copyright 2012, the Dart project authors.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software without
   specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## flutter/skills

- Source: https://github.com/flutter/skills
- License: BSD-3-Clause
- Skills (0): none as standalone skills; all of its content lives in the files listed below
- Adapted into reis-mobile skills (upstream skill → file under `skills/`): `flutter-managing-state` → `mobile-architecture/references/flutter/managing-state.md`, `flutter-apply-architecture-best-practices` → `mobile-architecture/references/flutter/recommended-architecture.md`, `flutter-fix-layout-issues` → `mobile-debug/references/flutter/layout-issues.md`, `flutter-improving-accessibility` → `mobile-flutter/references/accessibility-i18n/accessibility.md`, `flutter-setup-localization` → `mobile-flutter/references/accessibility-i18n/localization.md`, `flutter-caching-data` → `mobile-flutter/references/data/caching.md`, `flutter-working-with-databases` → `mobile-flutter/references/data/databases.md`, `flutter-use-http-package` → `mobile-flutter/references/data/http.md`, `flutter-implement-json-serialization` → `mobile-flutter/references/data/json-serialization.md`, `flutter-interoperating-with-native-apis` → `mobile-flutter/references/native/native-apis.md`, `flutter-embedding-native-views` → `mobile-flutter/references/native/native-views.md`, `flutter-building-plugins` → `mobile-flutter/references/native/plugins.md`, `flutter-reducing-app-size` → `mobile-flutter/references/performance/app-size.md`, `flutter-handling-concurrency` → `mobile-flutter/references/performance/concurrency.md`, `flutter-setting-up-on-macos` → `mobile-flutter/references/setup/macos.md`, `flutter-animating-apps` → `mobile-flutter/references/ui/animations.md`, `flutter-building-forms` → `mobile-flutter/references/ui/forms.md`, `flutter-adding-home-screen-widgets` → `mobile-flutter/references/ui/home-screen-widgets.md`, `flutter-building-layouts` → `mobile-flutter/references/ui/layouts.md`, `flutter-build-responsive-layout` → `mobile-flutter/references/ui/responsive-layout.md`, `flutter-setup-declarative-routing` → `mobile-flutter/references/ui/routing.md`, `flutter-theming-apps` → `mobile-flutter/references/ui/theming.md`, `flutter-add-widget-preview` → `mobile-flutter/references/ui/widget-previews.md`, `flutter-add-integration-test` → `mobile-test/references/flutter/integration-tests.md`, `flutter-add-widget-test` → `mobile-test/references/flutter/widget-tests.md`

```text
Copyright 2026 The Flutter Authors. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software without
   specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## android/skills

- Source: https://github.com/android/skills
- Revision: `466e1b5c5beb86cde9d35c81c2ffd26c6aef0502` (2026-09-15)
- License: Apache-2.0
- Skills (0): none as standalone skills; all of its content lives in the files listed below
- Adapted into reis-mobile skills (upstream skill → file under `skills/`): `agp-9-upgrade` → `mobile-android/references/build-and-performance/agp-9-upgrade/GUIDE.md`, `android-cli` → `mobile-android/references/build-and-performance/android-cli/GUIDE.md`, `android-profiler` → `mobile-android/references/build-and-performance/android-profiler/GUIDE.md`, `r8-analyzer` → `mobile-android/references/build-and-performance/r8-analyzer/GUIDE.md`, `display-glasses-with-jetpack-compose-glimmer` → `mobile-android/references/devices/display-glasses-with-jetpack-compose-glimmer/GUIDE.md`, `leanback-to-compose-tv-migration` → `mobile-android/references/devices/leanback-to-compose-tv-migration/GUIDE.md`, `wear-compose-m3` → `mobile-android/references/devices/wear-compose-m3/GUIDE.md`, `restore-credentials` → `mobile-android/references/identity/restore-credentials/GUIDE.md`, `verified-email` → `mobile-android/references/identity/verified-email/GUIDE.md`, `camerax` → `mobile-android/references/media/camerax/GUIDE.md`, `media3-cast-integration` → `mobile-android/references/media/media3-cast-integration/GUIDE.md`, `appfunctions` → `mobile-android/references/on-device-ai/appfunctions/GUIDE.md`, `ml-kit-genai-prompt-api` → `mobile-android/references/on-device-ai/ml-kit-genai-prompt-api/GUIDE.md`, `engage-sdk-integration` → `mobile-android/references/play/engage-sdk-integration/GUIDE.md`, `play-billing-library-version-upgrade` → `mobile-android/references/play/play-billing-library-version-upgrade/GUIDE.md`, `play-policy-insights` → `mobile-android/references/play/play-policy-insights/GUIDE.md`, `adaptive` → `mobile-android/references/ui/adaptive/GUIDE.md`, `edge-to-edge` → `mobile-android/references/ui/edge-to-edge/GUIDE.md`, `migrate-xml-views-to-jetpack-compose` → `mobile-android/references/ui/migrate-xml-views-to-jetpack-compose/GUIDE.md`, `navigation-3` → `mobile-android/references/ui/navigation-3/GUIDE.md`, `navigation-event` → `mobile-android/references/ui/navigation-event/GUIDE.md`, `styles` → `mobile-android/references/ui/styles/GUIDE.md`, `android-intent-security` → `mobile-security/references/android/intent-security.md`, `testing-setup` → `mobile-test/references/android/setup/GUIDE.md`
- Changes made by reis-mobile: each skill folder was moved from its category path (for example `performance/r8-analyzer/`) into `skills/mobile-android/references/<topic>/<skill>/` (the testing and intent security skills into `mobile-test` and `mobile-security`), its `SKILL.md` renamed to `GUIDE.md` and its frontmatter replaced by an attribution line. The instructions, references, resources and scripts are unchanged.

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
