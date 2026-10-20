# protobuf-javalite ships its own R8 rules (META-INF/proguard/protobuf.pro), which keep the
# fields that lite messages read by reflection. connect-kotlin needs no extra rules.
# Add rules here only for a verified R8 failure, and record the failing call in the comment.
