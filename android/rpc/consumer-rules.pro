# The protobuf lite runtime reads message fields by name through reflection (MessageSchema).
# protobuf-javalite 4.36.2 ships no R8 rules. Without this rule, R8 renamed
# club.leanmuscle.boji.v1.Membership.nickname_ to e in the release mapping, and decoding fails with
# "RuntimeException: Field nickname_ for ... not found".
# See "R8 rule to make production app builds work" in
# https://github.com/protocolbuffers/protobuf/blob/main/java/lite.md
# This keeps field names only, so R8 still removes message classes that the app does not use.
-keepclassmembers class * extends com.google.protobuf.GeneratedMessageLite {
    <fields>;
}

# connect-kotlin ships its own rules. Add rules here only for a verified R8 failure,
# and record the failing call in the comment.
