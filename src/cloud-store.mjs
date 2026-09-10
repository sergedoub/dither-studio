export const BUCKET = "dither-images";
export function objectPaths(owner, id) {
  if (!/^[0-9a-f-]{36}$/i.test(owner) || !/^[0-9a-f-]{36}$/i.test(id))
    throw Error("Invalid project identity");
  return {
    source: `${owner}/${id}/source.png`,
    output: `${owner}/${id}/output.png`,
  };
}
export async function saveProject(client, user, snapshot) {
  if (!user?.id) throw Error("Sign in before saving.");
  if (
    snapshot.source.size > 20 * 1024 * 1024 ||
    snapshot.output.size > 20 * 1024 * 1024
  )
    throw Error(
      "Cloud saves support PNG files up to 20 MB each. Use local export for larger images.",
    );
  const id = crypto.randomUUID(),
    paths = objectPaths(user.id, id),
    uploaded = [];
  try {
    for (const [path, blob] of [
      [paths.source, snapshot.source],
      [paths.output, snapshot.output],
    ]) {
      const { error } = await client.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (error) throw error;
      uploaded.push(path);
    }
    const { error } = await client
      .from("dither_projects")
      .insert({
        id,
        owner_id: user.id,
        name: snapshot.name.slice(0, 240) || "Untitled",
        source_path: paths.source,
        output_path: paths.output,
        settings: snapshot.settings,
        palette: snapshot.palette,
        width: snapshot.width,
        height: snapshot.height,
      });
    if (error) throw error;
    return id;
  } catch (error) {
    if (uploaded.length)
      await client.storage
        .from(BUCKET)
        .remove(uploaded)
        .catch(() => {});
    throw error;
  }
}
export async function listProjects(client) {
  const { data, error } = await client
    .from("dither_projects")
    .select(
      "id,name,source_path,output_path,settings,palette,width,height,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
export async function loadProject(client, project) {
  const { data, error } = await client.storage
    .from(BUCKET)
    .download(project.source_path);
  if (error) throw error;
  return {
    file: new File([data], project.name, { type: "image/png" }),
    preset: {
      version: 1,
      settings: project.settings,
      palette: project.palette,
    },
  };
}
